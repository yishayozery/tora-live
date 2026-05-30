#!/usr/bin/env python3
"""
TORA_LIVE — Room Daemon for Raspberry Pi.

מטרה: לרוץ ברציפות על Pi בחדר שיעור. כל 10 שניות שואל את TORA_LIVE
"האם לשדר עכשיו?". אם כן — מפעיל ffmpeg שמושך מהמצלמה ומשדר RTMP
ל-Cloudflare. אם לא — עוצר את ffmpeg.

תכונות:
    - Polling פסיבי (יוצא בלבד) — לא צריך port forwarding/VPN
    - Auto-restart אם ffmpeg קורס באמצע שידור
    - Heartbeat ל-TORA_LIVE לניטור online/offline
    - Logging פשוט ל-stdout (systemd journal יתפוס)
    - חינני במידה והרשת נופלת: backoff ל-30 שניות, ניסיון חוזר

תלויות מערכת:
    - ffmpeg (apt install ffmpeg)
    - python3 + requests (pip install requests)
    - V4L2 camera (USB) או /dev/video0
    - ALSA mic או USB audio interface

קונפיגורציה — קובץ /etc/tora-room.json:
    {
      "api_base": "https://torah-live-rho.vercel.app",
      "room_id": "cmpxxx...",                  # ה-id של החדר ב-DB
      "device_token": "abc123...",             # מ-Room.deviceToken
      "video_device": "/dev/video0",           # מצלמה
      "audio_device": "hw:1,0",                # מיקרופון ALSA
      "resolution": "1280x720",                # אופציונלי
      "framerate": 30,                         # אופציונלי
      "video_bitrate": "2500k",                # אופציונלי
      "audio_bitrate": "128k"                  # אופציונלי
    }

הפעלה כ-systemd service:
    sudo systemctl enable tora-room.service
    sudo systemctl start tora-room.service
    journalctl -u tora-room.service -f
"""

import json
import os
import signal
import subprocess
import sys
import time
from typing import Optional

try:
    import requests
except ImportError:
    sys.stderr.write("ERROR: requests not installed. Run: pip install requests\n")
    sys.exit(1)


CONFIG_PATH = os.environ.get("TORA_ROOM_CONFIG", "/etc/tora-room.json")
POLL_INTERVAL_SEC = 10
NET_BACKOFF_SEC = 30
FFMPEG_GRACE_SEC = 5  # waiting for ffmpeg to terminate cleanly


def log(level: str, msg: str) -> None:
    """Simple stdout logging — systemd journal will capture with timestamps."""
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {level}: {msg}", flush=True)


def load_config() -> dict:
    """Read JSON config; abort if required fields missing."""
    try:
        with open(CONFIG_PATH, "r") as f:
            cfg = json.load(f)
    except FileNotFoundError:
        log("ERROR", f"Config not found: {CONFIG_PATH}")
        sys.exit(2)
    except json.JSONDecodeError as e:
        log("ERROR", f"Config JSON invalid: {e}")
        sys.exit(2)

    required = ["api_base", "room_id", "device_token"]
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        log("ERROR", f"Config missing required keys: {missing}")
        sys.exit(2)

    # Sensible defaults — most yeshivot use a USB webcam + USB mic
    cfg.setdefault("video_device", "/dev/video0")
    cfg.setdefault("audio_device", "default")
    cfg.setdefault("resolution", "1280x720")
    cfg.setdefault("framerate", 30)
    cfg.setdefault("video_bitrate", "2500k")
    cfg.setdefault("audio_bitrate", "128k")
    return cfg


def poll_state(cfg: dict) -> Optional[dict]:
    """
    GET /api/rooms/{id}/state — returns {shouldStream, rtmpUrl, streamKey, roomName}
    Returns None on network/auth failure (caller will retry).
    """
    url = f"{cfg['api_base']}/api/rooms/{cfg['room_id']}/state"
    headers = {"X-Device-Token": cfg["device_token"]}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 401:
            log("ERROR", "Unauthorized — device_token mismatch. Check config.")
            return None
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        log("WARN", f"Poll failed: {e}")
        return None


def build_ffmpeg_command(cfg: dict, state: dict) -> list:
    """
    Build ffmpeg command line. Pulls v4l2 camera + ALSA audio, encodes h264+aac,
    pushes to Cloudflare RTMP. Optimized for low-latency live broadcast.
    """
    rtmp_target = f"{state['rtmpUrl'].rstrip('/')}{state['streamKey']}"
    return [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "warning",
        # Video: V4L2 camera
        "-f", "v4l2",
        "-input_format", "mjpeg",
        "-video_size", cfg["resolution"],
        "-framerate", str(cfg["framerate"]),
        "-i", cfg["video_device"],
        # Audio: ALSA
        "-f", "alsa",
        "-ac", "2",
        "-i", cfg["audio_device"],
        # Video encode — H.264 baseline for compatibility, low-latency
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-pix_fmt", "yuv420p",
        "-g", str(cfg["framerate"] * 2),  # keyframe every 2 sec
        "-b:v", cfg["video_bitrate"],
        "-maxrate", cfg["video_bitrate"],
        "-bufsize", cfg["video_bitrate"],
        # Audio encode — AAC LC
        "-c:a", "aac",
        "-ar", "44100",
        "-b:a", cfg["audio_bitrate"],
        # Output to RTMP
        "-f", "flv",
        rtmp_target,
    ]


class FFmpegSession:
    """Wraps a single ffmpeg subprocess with start/stop/is_alive."""

    def __init__(self):
        self.proc: Optional[subprocess.Popen] = None

    def is_alive(self) -> bool:
        return self.proc is not None and self.proc.poll() is None

    def start(self, cmd: list) -> None:
        if self.is_alive():
            log("WARN", "Tried to start ffmpeg but already running")
            return
        log("INFO", f"Starting ffmpeg → {cmd[-1][:60]}...")
        # Detach from parent's stdin; keep stdout/stderr for diagnostics
        self.proc = subprocess.Popen(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

    def stop(self) -> None:
        if not self.is_alive():
            return
        log("INFO", "Stopping ffmpeg gracefully...")
        try:
            assert self.proc is not None
            self.proc.terminate()
            self.proc.wait(timeout=FFMPEG_GRACE_SEC)
        except subprocess.TimeoutExpired:
            log("WARN", "ffmpeg ignored SIGTERM, sending SIGKILL")
            assert self.proc is not None
            self.proc.kill()
            self.proc.wait()
        finally:
            self.proc = None


def main() -> int:
    cfg = load_config()
    log("INFO", f"Daemon started. Room: {cfg['room_id']}. API: {cfg['api_base']}")

    ff = FFmpegSession()

    # Clean shutdown on SIGTERM (systemd stop) / SIGINT (Ctrl-C)
    def shutdown(signum, frame):
        log("INFO", f"Received signal {signum}, stopping ffmpeg and exiting")
        ff.stop()
        sys.exit(0)
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    while True:
        state = poll_state(cfg)
        if state is None:
            # Network/auth fail — back off so we don't hammer the API
            time.sleep(NET_BACKOFF_SEC)
            continue

        should_stream = bool(state.get("shouldStream"))

        if should_stream and not ff.is_alive():
            cmd = build_ffmpeg_command(cfg, state)
            ff.start(cmd)
        elif not should_stream and ff.is_alive():
            ff.stop()
        elif should_stream and ff.is_alive():
            # Streaming as expected. Check if ffmpeg died unexpectedly.
            # is_alive() == True means proc.poll() is None, so we're fine.
            pass

        # Auto-recovery: if we WANT to stream but ffmpeg died, restart on next loop
        # (is_alive() returns False once proc exits, so the first branch above will retry)

        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    sys.exit(main())
