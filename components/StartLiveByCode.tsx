"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { KeyRound, Radio, X, ArrowRight, Loader2, Link as LinkIcon } from "lucide-react";

type Props = {
  lessonId: string;
  lessonTitle: string;
};

export function StartLiveByCode({ lessonId, lessonTitle }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setCode("");
    setUrl("");
    setError(null);
  }

  function submit() {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-gold/40 bg-gold/5 text-ink text-sm font-semibold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <KeyRound className="w-4 h-4 text-gold" />
        פתח שידור עם קוד
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog" aria-modal="true" aria-label="פתיחת שידור עם קוד"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="w-full max-w-lg bg-white rounded-card shadow-card p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink">פתח שידור עם קוד</h2>
                <div className="text-sm text-ink-muted mt-1">{lessonTitle}</div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="סגור"
                className="shrink-0 p-2 rounded-btn hover:bg-paper-soft"
              >
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>

            <p className="text-sm text-ink-soft mb-4 leading-relaxed">
              הזן את הקוד שהרב שלח (פורמט: 4 ספרות-מילה), והדבק קישור לשידור החי שכבר התחיל ב-YouTube / Zoom / אחר.
            </p>

            <label htmlFor="code" className="block text-sm text-ink-soft mb-1">קוד שידור</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (error) setError(null); }}
              placeholder="לדוגמה: 7421-תורה"
              autoFocus
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-base font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              dir="ltr"
            />

            <label htmlFor="live-url" className="block text-sm text-ink-soft mb-1 mt-4">
              קישור לשידור החי (YouTube / Zoom / אחר)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-ink-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                id="live-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }}
                placeholder="https://youtube.com/live/..."
                className="w-full h-11 ps-9 pe-3 rounded-btn border border-border bg-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                dir="ltr"
              />
            </div>

            {error && <div className="mt-3 text-sm text-danger">{error}</div>}

            <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button variant="secondary" size="md" onClick={close} disabled={pending}>
                <ArrowRight className="w-4 h-4" />
                ביטול
              </Button>
              <Button variant="primary" size="md" onClick={submit} disabled={pending || !code.trim() || !url.trim()}>
                {pending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />פותח…</>
                ) : (
                  <><Radio className="w-4 h-4" />פתח שידור</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
