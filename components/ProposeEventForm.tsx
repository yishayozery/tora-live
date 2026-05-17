"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HebrewDateHint } from "@/components/HebrewDateHint";
import { HebrewDatePicker } from "@/components/HebrewDatePicker";
import { Info, CheckCircle2, Upload, X, FileImage, Loader2 } from "lucide-react";

type FormState = {
  title: string;
  description: string;
  scheduledAt: string;
  locationName: string;
  locationUrl: string;
  posterUrl: string;
  liveEmbedUrl: string;
};

const INITIAL: FormState = {
  title: "",
  description: "",
  scheduledAt: "",
  locationName: "",
  locationUrl: "",
  posterUrl: "",
  liveEmbedUrl: "",
};

export function ProposeEventForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadPoster(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/poster", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "שגיאה בהעלאת הקובץ");
        return;
      }
      update("posterUrl", data.url);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.title.trim().length < 3) return setError("כותרת חייבת להכיל לפחות 3 תווים");
    if (form.description.trim().length < 20) return setError("תיאור חייב להכיל לפחות 20 תווים");
    if (!form.scheduledAt) return setError("בחר תאריך ושעה");

    setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "שגיאה בשליחה");
      return;
    }
    setSubmitted(true);
    setTimeout(() => router.push("/"), 2500);
  }

  if (submitted) {
    return (
      <Card className="text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-live mx-auto mb-3" />
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-2">
          ההצעה התקבלה!
        </h2>
        <p className="text-ink-soft">
          ההצעה הועברה לאדמין לאישור. תקבל התראה כאשר תיבדק.
        </p>
      </Card>
    );
  }

  const datePart = form.scheduledAt ? form.scheduledAt.slice(0, 10) : "";
  const timePart = form.scheduledAt.slice(11, 16);

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-btn bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2">
            {error}
          </div>
        )}

        <Field label="כותרת האירוע" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputCls}
            placeholder="למשל: יום עיון לזכר הרב..."
            required
          />
        </Field>

        <Field label="תיאור" required hint="מינימום 20 תווים — תאר את תוכן האירוע, מי ירצה, למי מיועד">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={`${inputCls} min-h-[120px]`}
            minLength={20}
            required
          />
        </Field>

        <Field label="תאריך ושעה" required>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <HebrewDatePicker
              value={datePart}
              onChange={(iso) => {
                const t = timePart || "10:00";
                update("scheduledAt", iso ? `${iso}T${t}` : "");
              }}
              minDate={new Date().toISOString().slice(0, 10)}
              placeholder="בחר תאריך"
              required
            />
            <input
              type="time"
              value={timePart}
              onChange={(e) => {
                const d = datePart || new Date().toISOString().slice(0, 10);
                update("scheduledAt", `${d}T${e.target.value}`);
              }}
              className={`${inputCls} sm:w-32`}
              aria-label="שעה"
              required
            />
          </div>
          <HebrewDateHint value={form.scheduledAt} />
        </Field>

        <Field label="סוג שידור">
          <div className="h-11 px-3 inline-flex items-center rounded-btn bg-purple-100 text-purple-700 text-sm font-medium border border-purple-300">
            📜 יום עיון / אירוע תורני
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="מיקום — שם המקום">
            <input
              type="text"
              value={form.locationName}
              onChange={(e) => update("locationName", e.target.value)}
              className={inputCls}
              placeholder="בית הכנסת / אולם..."
            />
          </Field>
          <Field label="קישור Google Maps">
            <input
              type="url"
              value={form.locationUrl}
              onChange={(e) => update("locationUrl", e.target.value)}
              className={inputCls}
              placeholder="https://maps.google.com/..."
              dir="ltr"
            />
          </Field>
        </div>

        {/* === העלאת פוסטר — קובץ ישיר === */}
        <Field label="פוסטר היום עיון" hint="תמונה (JPG/PNG/WebP) או PDF — עד 8MB">
          {form.posterUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-btn border border-live/30 bg-live/5">
              <FileImage className="w-5 h-5 text-live shrink-0" aria-hidden />
              <a
                href={form.posterUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-sm text-live hover:underline truncate"
                dir="ltr"
              >
                {form.posterUrl.split("/").pop()}
              </a>
              <button
                type="button"
                onClick={() => update("posterUrl", "")}
                className="p-1 text-ink-muted hover:text-danger"
                aria-label="הסר פוסטר"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPoster(f);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-btn border-2 border-dashed border-primary/40 bg-primary-soft/30 text-primary text-sm font-medium hover:bg-primary-soft hover:border-primary transition disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    העלה פוסטר
                  </>
                )}
              </button>
            </div>
          )}
          <p className="mt-1 flex items-start gap-1 text-xs text-ink-muted">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>הפוסטר יופיע בכרטיס יום העיון בלוח הראשי ובדף האירוע.</span>
          </p>
        </Field>

        <Field label="קישור לשידור חי (אופציונלי)" hint="YouTube / Zoom / Facebook Live">
          <input
            type="url"
            value={form.liveEmbedUrl}
            onChange={(e) => update("liveEmbedUrl", e.target.value)}
            className={inputCls}
            placeholder="https://youtube.com/live/..."
            dir="ltr"
          />
        </Field>

        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={busy || uploading}>
            {busy ? "שולח..." : "שלח הצעה לאישור"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

const inputCls =
  "w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
