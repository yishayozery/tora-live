// WHIP (WebRTC HTTP Ingestion Protocol) client for browser → Cloudflare Stream.
// Cloudflare Stream docs: https://developers.cloudflare.com/stream/webrtc-beta/
//
// Lifecycle:
//   1. createWhipPublisher({ whipUrl, stream }) → starts publishing.
//   2. publisher.connectionState — observable via onStateChange callback.
//   3. publisher.stop() — closes the connection, releases resources.
//
// Note: לא קוראים ל-stream.getTracks().forEach(stop) פה — זה באחריות הקורא,
// כי אותו MediaStream נמצא בשימוש גם ב-<video> של ה-preview.

export type WhipState = "connecting" | "connected" | "disconnected" | "failed" | "closed";

export type WhipPublisher = {
  /** Current connection state — also delivered via onStateChange. */
  readonly state: WhipState;
  /** Stop publishing and tear down the PeerConnection. Idempotent. */
  stop: () => Promise<void>;
};

export type CreateWhipOptions = {
  /** WHIP endpoint URL returned by Cloudflare (input.webRTC.url). */
  whipUrl: string;
  /** The local MediaStream from getUserMedia (camera + mic). */
  stream: MediaStream;
  /** Notified on every state transition. */
  onStateChange?: (state: WhipState) => void;
  /** Notified once on fatal error (network, SDP, server). */
  onError?: (err: Error) => void;
  /** Override RTCPeerConnection (for testing). */
  rtcImpl?: typeof RTCPeerConnection;
  /** Override fetch (for testing). */
  fetchImpl?: typeof fetch;
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
];

export async function createWhipPublisher(opts: CreateWhipOptions): Promise<WhipPublisher> {
  const {
    whipUrl,
    stream,
    onStateChange,
    onError,
    rtcImpl = typeof RTCPeerConnection !== "undefined" ? RTCPeerConnection : (undefined as any),
    fetchImpl = typeof fetch !== "undefined" ? fetch : (undefined as any),
  } = opts;

  if (!rtcImpl) throw new Error("WebRTC לא נתמך בדפדפן הזה");
  if (!fetchImpl) throw new Error("fetch לא נתמך בסביבה הזו");
  if (!whipUrl) throw new Error("חסר WHIP URL");

  let state: WhipState = "connecting";
  let resourceUrl: string | null = null;
  let stopped = false;

  function setState(next: WhipState) {
    if (state === next) return;
    state = next;
    try { onStateChange?.(next); } catch { /* swallow */ }
  }

  const pc = new rtcImpl({ iceServers: DEFAULT_ICE_SERVERS });

  // Add local tracks (sendonly — publisher doesn't receive).
  for (const track of stream.getTracks()) {
    pc.addTransceiver(track, { direction: "sendonly", streams: [stream] });
  }

  pc.addEventListener("connectionstatechange", () => {
    const cs = pc.connectionState;
    if (cs === "connected") setState("connected");
    else if (cs === "disconnected") setState("disconnected");
    else if (cs === "failed" || cs === "closed") {
      setState(cs === "failed" ? "failed" : "closed");
    }
  });

  async function start() {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Wait for ICE gathering — או טיים-אאוט קצר כדי לא להיתקע.
      await waitForIceGathering(pc, 4000);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("נכשל ייצור SDP");

      const res = await fetchImpl(whipUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: sdp,
      });

      if (!res.ok) {
        throw new Error(`WHIP server החזיר ${res.status}`);
      }

      // Resource URL מהשדה Location — נשמש בו ל-DELETE בסיום.
      const loc = res.headers.get("Location") || res.headers.get("location");
      if (loc) {
        try { resourceUrl = new URL(loc, whipUrl).toString(); }
        catch { resourceUrl = loc; }
      }

      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      // לאחר setRemoteDescription, connectionstatechange יחזור עם "connected" → setState.
    } catch (err: any) {
      setState("failed");
      try { onError?.(err instanceof Error ? err : new Error(String(err))); } catch { /* swallow */ }
      try { pc.close(); } catch { /* swallow */ }
      throw err;
    }
  }

  await start();

  return {
    get state() { return state; },
    async stop() {
      if (stopped) return;
      stopped = true;
      // הודעה ל-WHIP server (best-effort; לא מפיל אם נכשל)
      if (resourceUrl) {
        try { await fetchImpl(resourceUrl, { method: "DELETE" }); } catch { /* swallow */ }
      }
      try { pc.close(); } catch { /* swallow */ }
      setState("closed");
    },
  };
}

// === Internals ===

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", check);
      clearTimeout(t);
      resolve();
    };
    const check = () => { if (pc.iceGatheringState === "complete") done(); };
    pc.addEventListener("icegatheringstatechange", check);
    const t = setTimeout(done, timeoutMs);
  });
}
