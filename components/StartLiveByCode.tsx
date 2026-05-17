"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { KeyRound, Radio, X, ArrowRight, Loader2, Link as LinkIcon, Video, ExternalLink } from "lucide-react";
import { createWhipPublisher, type WhipPublisher } from "@/lib/whipClient";

type Props = {
  lessonId: string;
  lessonTitle: string;
};

type Step = "closed" | "code" | "method" | "external" | "browser-preview" | "browser-live";

export function StartLiveByCode({ lessonId, lessonTitle }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<Step>("closed");
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Browser-mode state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const publisherRef = useRef<WhipPublisher | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [whipStatus, setWhipStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  // טריגר re-render כשהמצלמה נדלקת — useRef לא מטריגר render אז הכפתור היה נשאר disabled
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (step === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // cleanup camera/WHIP when modal closes
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function close() {
    stopCamera();
    setStep("closed");
    setCode("");
    setUrl("");
    setError(null);
    setMediaError(null);
    setWhipStatus("idle");
  }

  function stopCamera() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      streamRef.current = null;
    }
    if (videoRef.current) try { videoRef.current.srcObject = null; } catch {}
    const p = publisherRef.current;
    publisherRef.current = null;
    if (p) p.stop().catch(() => {});
    setCameraReady(false);
  }

  async function requestCamera() {
    setMediaError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("הדפדפן לא תומך במצלמה");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true); // טריגר re-render כדי שהכפתור יהפוך לפעיל
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError") setMediaError("אין הרשאת מצלמה. אשר בדפדפן.");
      else if (name === "NotFoundError") setMediaError("לא נמצאה מצלמה במחשב.");
      else setMediaError(err?.message || "שגיאה בגישה למצלמה");
    }
  }

  async function submitExternal() {
    if (!code.trim()) return setError("יש להזין קוד");
    const trimmed = url.trim();
    try {
      const u = new URL(trimmed);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      return setError("קישור לשידור לא תקין");
    }
    setError(null);
    const liveMethod = /youtu\.?be/i.test(trimmed) ? "YOUTUBE" : "EXTERNAL";

    start(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/live-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), liveMethod, liveEmbedUrl: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "שגיאה בפתיחת השידור");
        return;
      }
      close();
      router.refresh();
    });
  }

  async function submitBrowser() {
    if (!code.trim()) return setError("יש להזין קוד");
    if (!streamRef.current) return setMediaError("המצלמה לא פעילה");
    setError(null);
    setMediaError(null);

    start(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/live-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), liveMethod: "BROWSER" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "שגיאה בפתיחת השידור");
        return;
      }
      // קיבלנו whipUrl — מתחבר ומשדר
      try {
        setWhipStatus("connecting");
        const publisher = await createWhipPublisher({
          whipUrl: data.whipUrl,
          stream: streamRef.current!,
          onStateChange: (s) => {
            if (s === "connected") setWhipStatus("connected");
            else if (s === "failed" || s === "closed") setWhipStatus("failed");
          },
        });
        publisherRef.current = publisher;
        setStep("browser-live");
        router.refresh();
      } catch (err: any) {
        setWhipStatus("failed");
        setMediaError(err?.message || "שגיאה בהתחברות לשרת השידור");
      }
    });
  }

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("code")}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-gold/40 bg-gold/5 text-ink text-sm font-semibold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <KeyRound className="w-4 h-4 text-gold" />
        פתח שידור עם קוד
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog" aria-modal="true" aria-label="פתיחת שידור עם קוד"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-card shadow-card p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink">
              {step === "code" && "פתח שידור עם קוד"}
              {step === "method" && "איך תרצה לשדר?"}
              {step === "external" && "הדבק קישור לשידור"}
              {(step === "browser-preview" || step === "browser-live") && "שידור מהדפדפן"}
            </h2>
            <div className="text-sm text-ink-muted mt-1 truncate">{lessonTitle}</div>
          </div>
          <button type="button" onClick={close} aria-label="סגור" className="shrink-0 p-2 rounded-btn hover:bg-paper-soft">
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* === STEP 1: code === */}
        {step === "code" && (
          <>
            <p className="text-sm text-ink-soft mb-4">
              הזן את הקוד שהרב שלח (פורמט: <code className="font-mono text-xs bg-paper-soft px-1.5 py-0.5 rounded">NNNN-מילה</code>):
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (error) setError(null); }}
              placeholder="לדוגמה: 7421-תורה"
              autoFocus
              dir="ltr"
              className="w-full h-12 px-3 rounded-btn border border-border bg-white text-base font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            {error && <div className="mt-3 text-sm text-danger">{error}</div>}
            <div className="mt-5 flex gap-3 justify-between">
              <Button variant="secondary" size="md" onClick={close}>
                <ArrowRight className="w-4 h-4" /> ביטול
              </Button>
              <Button variant="primary" size="md" onClick={() => {
                if (!code.trim()) return setError("יש להזין קוד");
                setError(null);
                setStep("method");
              }} disabled={!code.trim()}>
                המשך ←
              </Button>
            </div>
          </>
        )}

        {/* === STEP 2: method picker === */}
        {step === "method" && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">בחר איך תרצה לשדר:</p>
            <button
              type="button"
              onClick={async () => {
                setStep("browser-preview");
                await requestCamera();
              }}
              className="w-full text-start p-4 rounded-card border-2 border-border bg-white hover:border-primary hover:bg-primary/5 transition flex items-center gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Video className="w-6 h-6" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-bold text-ink">שדר מהדפדפן שלי</span>
                <span className="text-xs text-ink-muted">המצלמה והמיקרופון של המחשב הזה</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep("external")}
              className="w-full text-start p-4 rounded-card border-2 border-border bg-white hover:border-gold hover:bg-gold/5 transition flex items-center gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="shrink-0 w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <ExternalLink className="w-6 h-6" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-bold text-ink">קישור חיצוני (YouTube / Zoom)</span>
                <span className="text-xs text-ink-muted">אם השידור כבר רץ במקום אחר</span>
              </span>
            </button>
            <div className="pt-2">
              <Button variant="secondary" size="md" onClick={() => setStep("code")}>
                <ArrowRight className="w-4 h-4" /> חזור
              </Button>
            </div>
          </div>
        )}

        {/* === STEP 3a: external URL === */}
        {step === "external" && (
          <>
            <label htmlFor="live-url" className="block text-sm text-ink-soft mb-1">
              קישור לשידור (YouTube / Zoom / אחר):
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-ink-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                id="live-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }}
                placeholder="https://youtube.com/live/..."
                autoFocus
                dir="ltr"
                className="w-full h-11 ps-9 pe-3 rounded-btn border border-border bg-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            {error && <div className="mt-3 text-sm text-danger">{error}</div>}
            <div className="mt-5 flex gap-3 justify-between">
              <Button variant="secondary" size="md" onClick={() => setStep("method")} disabled={pending}>
                <ArrowRight className="w-4 h-4" /> חזור
              </Button>
              <Button variant="primary" size="md" onClick={submitExternal} disabled={pending || !url.trim()}>
                {pending ? (<><Loader2 className="w-4 h-4 animate-spin" />פותח…</>) : (<><Radio className="w-4 h-4" />פתח שידור</>)}
              </Button>
            </div>
          </>
        )}

        {/* === STEP 3b: browser preview === */}
        {step === "browser-preview" && (
          <>
            <div className="relative rounded-card overflow-hidden bg-black aspect-video border border-border mb-3">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white bg-black/80 text-sm">
                  {mediaError}
                </div>
              )}
            </div>
            {error && <div className="text-sm text-danger mb-3">{error}</div>}
            <div className="flex gap-3 justify-between">
              <Button variant="secondary" size="md" onClick={() => { stopCamera(); setStep("method"); }} disabled={pending}>
                <ArrowRight className="w-4 h-4" /> חזור
              </Button>
              <Button variant="danger" size="md" onClick={submitBrowser} disabled={pending || !cameraReady}>
                {pending ? (<><Loader2 className="w-4 h-4 animate-spin" />פותח…</>) : (<><Radio className="w-4 h-4" />התחל שידור בפועל</>)}
              </Button>
            </div>
          </>
        )}

        {/* === STEP 4: browser live (status) === */}
        {step === "browser-live" && (
          <div className="text-center py-6">
            {whipStatus === "connecting" && (
              <>
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
                <p className="font-bold text-ink">מתחבר ל-Cloudflare…</p>
              </>
            )}
            {whipStatus === "connected" && (
              <>
                <Radio className="w-12 h-12 text-live mx-auto mb-3 animate-pulse" />
                <p className="font-bold text-ink mb-1">📡 שידור פעיל</p>
                <p className="text-sm text-ink-muted">הצופים יראו אותך תוך 15-30 שניות. אל תסגור את הדף.</p>
                <p className="text-xs text-ink-muted mt-3">השאר את הדף פתוח כל זמן השידור.</p>
              </>
            )}
            {whipStatus === "failed" && (
              <>
                <X className="w-12 h-12 text-danger mx-auto mb-3" />
                <p className="font-bold text-ink mb-2">השידור נכשל</p>
                <p className="text-sm text-ink-muted mb-4">{mediaError || error || "ייתכן שצריך לבדוק חיבור / מצלמה"}</p>
                <Button variant="secondary" size="md" onClick={close}>סגור</Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
