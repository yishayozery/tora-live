"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Radio, Square, Video, Link as LinkIcon, X, ArrowRight, Loader2 } from "lucide-react";
import { BrowserBroadcastPreview } from "@/components/BrowserBroadcastPreview";

type Method = "BROWSER" | "YOUTUBE" | "EXTERNAL";

type Props = {
  lessonId: string;
  lessonTitle?: string;
  lessonDate?: string; // ISO או טקסט מוכן
  isLive: boolean;
  currentMethod?: string;
  liveStartedAt?: string | null; // ISO — לתחילת מונה זמן
};

export function LiveStarter({
  lessonId,
  lessonTitle = "שיעור",
  lessonDate,
  isLive,
  currentMethod,
  liveStartedAt,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // dialog state
  const [step, setStep] = useState<"closed" | "picker" | "link" | "preview">("closed");
  const [linkMethod, setLinkMethod] = useState<Method>("EXTERNAL");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ---------- שידור פעיל ----------
  if (isLive) {
    return <LiveActiveBar lessonId={lessonId} liveStartedAt={liveStartedAt} currentMethod={currentMethod} />;
  }

  // ---------- סגירת דיאלוג ----------
  function closeDialog() {
    setStep("closed");
    setUrl("");
    setError(null);
  }

  // ---------- שידור externál / YouTube ----------
  function submitLink(method: Method) {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("יש להדביק קישור");
      return;
    }
    try {
      const u = new URL(trimmed);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      setError("הקישור לא תקין");
      return;
    }
    setError(null);

    start(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLive: true,
          liveMethod: method,
          liveEmbedUrl: trimmed,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "שגיאה בהתחלת השידור");
        return;
      }
      closeDialog();
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="md"
        variant="primary"
        onClick={() => setStep("picker")}
        disabled={pending}
      >
        <Radio className="w-4 h-4" />
        התחל שידור
      </Button>

      {/* --- שלב 1: בחירת מסלול --- */}
      {step === "picker" && (
        <Dialog onClose={closeDialog} title={`התחל שידור חי — ${lessonTitle}`} subtitle={lessonDate}>
          <div className="grid gap-3">
            <BigChoiceButton
              icon={<Video className="w-6 h-6" />}
              title="שדר מהדפדפן (בקרוב)"
              desc="בלי התקנות. המצלמה שלך ישירות באתר. — בבנייה, יושק בקרוב."
              variant="secondary"
              disabled
              onClick={() => {}}
            />
            <BigChoiceButton
              icon={<LinkIcon className="w-6 h-6" />}
              title="קישור חיצוני"
              desc="YouTube Live, Zoom, או כל קישור אחר."
              variant="secondary"
              onClick={() => {
                setLinkMethod("EXTERNAL");
                setStep("link");
              }}
            />
            <button
              type="button"
              onClick={closeDialog}
              className="mt-2 inline-flex items-center justify-center gap-2 h-11 rounded-btn text-ink-muted hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ArrowRight className="w-4 h-4" />
              חזור / ביטול
            </button>
          </div>
        </Dialog>
      )}

      {/* --- שלב "קישור חיצוני": הדבקת URL --- */}
      {step === "link" && (
        <Dialog onClose={closeDialog} title="קישור לשידור חיצוני" subtitle={lessonTitle}>
          <label htmlFor="live-url" className="block text-sm text-ink-soft mb-2">
            הדביקי קישור ל-YouTube Live, Zoom, או שידור אחר:
          </label>
          <input
            id="live-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://youtube.com/live/... או https://zoom.us/j/..."
            className="w-full h-11 px-3 rounded-btn border border-border bg-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            dir="ltr"
            autoFocus
          />
          <div className="mt-2 text-xs text-ink-muted">
            הקישור יוטמע (אם ניתן) או יוצג ככפתור מעבר לצופים.
          </div>
          {error && <div className="mt-2 text-sm text-danger">{error}</div>}

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep("picker")} disabled={pending}>
              <ArrowRight className="w-4 h-4" />
              חזור
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                // detect YouTube
                const isYoutube = /youtu\.?be/i.test(url);
                submitLink(isYoutube ? "YOUTUBE" : "EXTERNAL");
              }}
              disabled={pending || !url.trim()}
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מתחיל...
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  התחל שידור
                </>
              )}
            </Button>
          </div>
        </Dialog>
      )}

      {/* --- שלב 2: Preview מהדפדפן --- */}
      {step === "preview" && (
        <BrowserBroadcastPreview
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          onCancel={closeDialog}
          onStarted={closeDialog}
        />
      )}
    </>
  );
}

/* ============================================================
   סרגל "משדר עכשיו" + מונה זמן + כפתור סיום
   ============================================================ */
function LiveActiveBar({
  lessonId,
  liveStartedAt,
  currentMethod,
}: {
  lessonId: string;
  liveStartedAt?: string | null;
  currentMethod?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [elapsed, setElapsed] = useState<string>("00:00:00");

  useEffect(() => {
    const startMs = liveStartedAt ? new Date(liveStartedAt).getTime() : Date.now();
    function tick() {
      const diff = Math.max(0, Date.now() - startMs);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [liveStartedAt]);

  function stopBroadcast() {
    start(async () => {
      await fetch(`/api/lessons/${lessonId}/live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 items-stretch sm:items-end shrink-0 min-w-[220px]">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-btn bg-danger text-white shadow-soft animate-pulse"
        role="status"
        aria-live="polite"
      >
        <span className="w-2 h-2 rounded-full bg-white" aria-hidden />
        <span className="font-semibold text-sm">משדר עכשיו</span>
        <span className="font-mono text-sm tabular-nums" dir="ltr">{elapsed}</span>
      </div>
      <Button variant="danger" size="md" onClick={stopBroadcast} disabled={pending}>
        <Square className="w-4 h-4" />
        {pending ? "מסיים..." : "סיים שידור"}
      </Button>
      <div className="text-[11px] text-ink-muted text-center sm:text-end">
        ההקלטה תישמר אוטומטית ל-5 ימים
        {currentMethod ? ` · מסלול: ${methodLabel(currentMethod)}` : ""}
      </div>
    </div>
  );
}

function methodLabel(m: string) {
  if (m === "BROWSER") return "דפדפן";
  if (m === "YOUTUBE") return "YouTube";
  if (m === "EXTERNAL") return "קישור";
  return m;
}

/* ============================================================
   Primitives — Dialog + BigChoiceButton
   ============================================================ */
function Dialog({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // ESC לסגירה
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-card shadow-card p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink">{title}</h2>
            {subtitle && <div className="text-sm text-ink-muted mt-1">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="shrink-0 p-2 rounded-btn hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BigChoiceButton({
  icon,
  title,
  desc,
  variant,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  variant: "primary" | "secondary";
  onClick: () => void;
  disabled?: boolean;
}) {
  const base =
    "w-full text-start p-4 rounded-card border transition-colors flex items-center gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const variants =
    variant === "primary"
      ? "bg-primary text-white border-primary hover:bg-primary-hover shadow-soft"
      : "bg-white text-ink border-border hover:bg-paper-soft";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants}`}>
      <span
        className={
          "shrink-0 w-12 h-12 rounded-full flex items-center justify-center " +
          (variant === "primary" ? "bg-white/15" : "bg-paper-soft text-primary")
        }
      >
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="font-bold text-base">{title}</span>
        <span className={"text-sm " + (variant === "primary" ? "text-white/85" : "text-ink-muted")}>
          {desc}
        </span>
      </span>
    </button>
  );
}
