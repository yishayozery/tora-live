"use client";

import { useState, useEffect } from "react";
import { Flag, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Category = "INAPPROPRIATE" | "SPAM" | "TECHNICAL";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "INAPPROPRIATE", label: "תוכן לא הולם" },
  { value: "SPAM", label: "ספאם" },
  { value: "TECHNICAL", label: "בעיה טכנית" },
];

export function ReportLessonButton({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("INAPPROPRIATE");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Escape לסגירה
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function submit() {
    if (description.trim().length < 3) {
      setError("נא לתאר בקצרה את הבעיה");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/lessons/${lessonId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, description }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (res.status === 409) {
      setInfo(json?.error || "כבר דיווחת על שיעור זה — הדיווח שלך עדיין בטיפול");
      return;
    }
    if (!res.ok) {
      setError(json?.error || "שגיאה בשליחה");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="דווח על שיעור"
        title="דווח על שיעור"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-danger transition px-2 py-1 rounded-btn"
      >
        <Flag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">דווח</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !busy && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div
            className="bg-white rounded-card shadow-soft w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="report-modal-title" className="hebrew-serif text-xl font-bold">דיווח על שיעור</h2>
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="p-1 hover:bg-paper-soft rounded"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-live mx-auto mb-3" />
                <p className="text-ink font-medium mb-1">הדיווח התקבל</p>
                <p className="text-sm text-ink-muted">
                  הדיווח יועבר לאדמין לבדיקה. תודה.
                </p>
                <div className="mt-5">
                  <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                    סגור
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="rounded-btn bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="rounded-btn bg-paper-warm border border-border-warm text-ink text-sm px-3 py-2">
                    {info}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    סיבה
                  </label>
                  <div className="space-y-1.5">
                    {CATEGORIES.map((c) => (
                      <label
                        key={c.value}
                        className="flex items-center gap-2 px-3 py-2 rounded-btn border border-border hover:bg-paper-soft cursor-pointer text-sm"
                      >
                        <input
                          type="radio"
                          name="report-category"
                          value={c.value}
                          checked={category === c.value}
                          onChange={() => setCategory(c.value)}
                          className="accent-primary"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    פרטים
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[90px] px-3 py-2 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="תאר בקצרה את הבעיה..."
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={submit}
                    disabled={busy}
                  >
                    {busy ? "שולח..." : "שלח דיווח"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
