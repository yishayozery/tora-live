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

  // מעבר ל-studio
  const [studioMode, setStudioMode] = useState(false);
  const [studioStartedAt, setStudioStartedAt] = useState<Date | null>(null);

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
        onEnded={() => {
          streamRef.current = null;
          setStudioMode(false);
          onStarted?.();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="תצוגה מקדימה לשידור חי">
      <div className="w-full max-w-2xl bg-white rounded-card shadow-card p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink">
              תצוגה מקדימה — {lessonTitle}
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              בדקי את המצלמה והמיקרופון. השידור עדיין לא התחיל.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="סגור"
            className="shrink-0 p-2 rounded-btn hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* Video preview */}
        <div className="relative rounded-card overflow-hidden bg-black aspect-video border border-border">
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
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white bg-black/70 text-sm">
              {mediaError}
            </div>
          )}
        </div>

        {/* LEDs */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <StatusDot
            ok={hasVideo}
            label={hasVideo ? "מצלמה זמינה" : "אין מצלמה"}
            Icon={Video}
          />
          <StatusDot
            ok={hasAudio}
            label={hasAudio ? "מיקרופון זמין" : "אין מיקרופון"}
            Icon={Mic}
          />
        </div>

        {/* Sources */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-ink-muted" />
            <span className="text-sm font-semibold text-ink">מקור לימוד (אופציונלי)</span>
          </div>
          <label className="block text-xs text-ink-muted mb-1" htmlFor="source-url">
            קישור ל-PDF / מקור
          </label>
          <input
            id="source-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/sources/gemara.pdf"
            dir="ltr"
            className="w-full h-10 px-3 rounded-btn border border-border bg-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
          <div className="mt-2 text-xs text-ink-muted">
            <label className="inline-flex items-center gap-2 cursor-pointer hover:text-ink">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="hidden"
              />
              <span className="underline">או בחרי קובץ PDF</span>
              {sourceName && <span className="text-ink">· {sourceName}</span>}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={pending}
            type="button"
          >
            <X className="w-4 h-4" />
            ביטול וחזור
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={handleStart}
            disabled={pending || !hasVideo}
            type="button"
            className="sm:min-w-[220px]"
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
