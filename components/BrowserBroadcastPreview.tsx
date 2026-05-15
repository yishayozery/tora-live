"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Radio, X, Video, Mic, FileText, Loader2 } from "lucide-react";
import { RabbiBroadcastStudio } from "@/components/RabbiBroadcastStudio";

type Props = {
  lessonId: string;
  lessonTitle: string;
  onCancel: () => void;
  onStarted?: () => void;
};

/**
 * מסך Preview לפני שידור מהדפדפן.
 * - מציג את המצלמה והמיקרופון בזמן אמת (getUserMedia)
 * - מאפשר הוספת מקור (URL של PDF)
 * - מתחיל שידור רק בלחיצה על "התחל שידור בפועל"
 * - מבטיח כיבוי המצלמה בכל יציאה (unmount / cancel / beforeunload)
 */
export function BrowserBroadcastPreview({ lessonId, lessonTitle, onCancel, onStarted }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [pending, start] = useTransition();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [requesting, setRequesting] = useState(true);

  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);

  // מעבר ל-studio
  const [studioMode, setStudioMode] = useState(false);
  const [studioStartedAt, setStudioStartedAt] = useState<Date | null>(null);
  const [whipUrl, setWhipUrl] = useState<string | undefined>(undefined);
  const [viewerEmbedUrl, setViewerEmbedUrl] = useState<string | undefined>(undefined);

  // ---- Cleanup של המצלמה/מיקרופון ----
  function stopTracks() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch {}
    }
  }

  // --- בקשת הרשאות רק בעת mount (אחרי לחיצה על "שדר מהדפדפן") ---
  useEffect(() => {
    let cancelled = false;

    async function requestMedia() {
      setRequesting(true);
      setMediaError(null);
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("הדפדפן אינו תומך בגישה למצלמה");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasVideo(stream.getVideoTracks().some((t) => t.readyState === "live"));
        setHasAudio(stream.getAudioTracks().some((t) => t.readyState === "live"));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setMediaError("אין הרשאת מצלמה. פתחי את הגדרות הדפדפן ואשרי גישה למצלמה ולמיקרופון.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setMediaError("לא נמצאה מצלמה או מיקרופון במחשב.");
        } else {
          setMediaError(err?.message || "שגיאה בגישה למצלמה");
        }
      } finally {
        if (!cancelled) setRequesting(false);
      }
    }
    requestMedia();

    // הגנה — כיבוי כשהמשתמש סוגר את הטאב
    const onBeforeUnload = () => stopTracks();
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      stopTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCancel() {
    stopTracks();
    onCancel();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // אין העלאה בפועל בשלב זה — רק שמירת שם. URL להדבקה נפרדת.
    setSourceName(f.name);
  }

  async function handleStart() {
    if (!hasVideo) return;

    start(async () => {
      try {
        // 1) התחלת שידור — PATCH (לא POST; זה ה-contract הקיים)
        const res = await fetch(`/api/lessons/${lessonId}/live`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLive: true, liveMethod: "BROWSER" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "שגיאה בהתחלת השידור");
        }
        const data = await res.json().catch(() => ({}));
        // ה-API מחזיר whipUrl (Cloudflare WHIP endpoint). נשמור ונעביר ל-Studio.
        setWhipUrl(typeof data?.whipUrl === "string" ? data.whipUrl : undefined);
        // playbackUrl/liveEmbedUrl — מה שצופים רואים. נציג כ-preview דיאגנוסטי באולפן.
        // ה-API לא מחזיר liveEmbedUrl אך כן streamId, ובידיעת CF_ACCOUNT אפשר לבנות.
        // הכי פשוט: נשתמש ב-playbackUrl/streamId לבניית iframe URL.
        if (typeof data?.streamId === "string") {
          // CF iframe URL: customer-<accountId>.cloudflarestream.com/<streamId>/iframe
          // ה-account-id משוקע ב-playbackUrl, נחלץ ממנו.
          const playback = data?.playbackUrl as string | undefined;
          const acctMatch = playback?.match(/customer-([a-f0-9]+)\.cloudflarestream\.com/);
          if (acctMatch) {
            setViewerEmbedUrl(`https://customer-${acctMatch[1]}.cloudflarestream.com/${data.streamId}/iframe`);
          }
        }

        // 2) אם הרב הדביק לינק למקור — יוצר LessonSource
        const trimmed = sourceUrl.trim();
        if (trimmed) {
          try {
            await fetch(`/api/lessons/${lessonId}/sources`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileUrl: trimmed,
                fileName: sourceName || null,
              }),
            });
          } catch { /* לא קריטי — השידור כבר התחיל */ }
        }

        // 3) מעבר ל-Studio — שומרים על ה-stream חי
        setStudioStartedAt(new Date());
        setStudioMode(true);
        router.refresh();
      } catch (err: any) {
        setMediaError(err?.message || "שגיאה בהתחלת השידור");
      }
    });
  }

  // --- Studio mode: אחרי התחלת השידור ---
  if (studioMode && streamRef.current && studioStartedAt) {
    return (
      <RabbiBroadcastStudio
        lessonId={lessonId}
        lessonTitle={lessonTitle}
        stream={streamRef.current}
        startedAt={studioStartedAt}
        whipUrl={whipUrl}
        viewerEmbedUrl={viewerEmbedUrl}
        onEnded={() => {
          streamRef.current = null;
          setStudioMode(false);
          onStarted?.();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="תצוגה מקדימה לשידור חי">
      <div className="w-full max-w-2xl bg-white rounded-card shadow-card p-3 sm:p-4 max-h-[100dvh] flex flex-col">
        {/* Header — קומפקטי */}
        <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
          <div className="min-w-0">
            <h2 className="hebrew-serif text-base sm:text-lg font-bold text-ink truncate">
              תצוגה מקדימה — {lessonTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="סגור"
            className="shrink-0 p-1.5 rounded-btn hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* Video preview — מוגבל בגובה כדי שהכל יכנס */}
        <div className="relative rounded-card overflow-hidden bg-black border border-border max-h-[55dvh] aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {requesting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              מבקש הרשאה למצלמה...
            </div>
          )}
          {mediaError && !requesting && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white bg-black/80 text-sm">
              {mediaError}
            </div>
          )}
          {/* LEDs קטנים בתוך הוידיאו */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
            <span className={"inline-flex items-center gap-1 " + (hasVideo ? "text-live" : "text-white/60")}>
              <Video className="w-3 h-3" /> {hasVideo ? "מצלמה" : "אין"}
            </span>
            <span className="opacity-40">·</span>
            <span className={"inline-flex items-center gap-1 " + (hasAudio ? "text-live" : "text-white/60")}>
              <Mic className="w-3 h-3" /> {hasAudio ? "מיקרופון" : "אין"}
            </span>
          </div>
        </div>

        {/* Sources — collapsed by default */}
        <div className="mt-2 shrink-0">
          {!sourceOpen ? (
            <button
              type="button"
              onClick={() => setSourceOpen(true)}
              className="text-xs text-ink-muted hover:text-primary inline-flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              + הוסף מקור לימוד / PDF (אופציונלי)
            </button>
          ) : (
            <div className="rounded-btn border border-border p-2 bg-paper-soft">
              <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
                <FileText className="w-3 h-3" />
                <span>קישור ל-PDF / מקור</span>
                <button type="button" onClick={() => setSourceOpen(false)} className="ms-auto text-ink-muted hover:text-ink"><X className="w-3 h-3" /></button>
              </div>
              <input
                id="source-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/gemara.pdf"
                dir="ltr"
                className="w-full h-9 px-2 rounded-btn border border-border bg-white text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          )}
        </div>

        {/* Actions — תמיד גלוי בתחתית */}
        <div className="mt-3 flex flex-row gap-2 sm:gap-3 sm:justify-between shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={pending}
            type="button"
          >
            <X className="w-4 h-4" />
            ביטול
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={handleStart}
            disabled={pending || !hasVideo}
            type="button"
            className="flex-1 sm:flex-none sm:min-w-[220px]"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מתחיל שידור...
              </>
            ) : (
              <>
                <Radio className="w-5 h-5" />
                התחל שידור בפועל
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusDot({
  ok,
  label,
  Icon,
}: {
  ok: boolean;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "w-2.5 h-2.5 rounded-full " +
          (ok ? "bg-live shadow-[0_0_0_3px_rgba(5,150,105,0.15)]" : "bg-ink-muted/40")
        }
        aria-hidden
      />
      <Icon className={"w-4 h-4 " + (ok ? "text-live" : "text-ink-muted")} />
      <span className={ok ? "text-ink" : "text-ink-muted"}>{label}</span>
    </div>
  );
}
