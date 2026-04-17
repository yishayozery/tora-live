"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HebrewDateHint } from "@/components/HebrewDateHint";
import { Info, CheckCircle2 } from "lucide-react";

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

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
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
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => update("scheduledAt", e.target.value)}
            className={inputCls}
            required
          />
          <HebrewDateHint value={form.scheduledAt} />
        </Field>

        <Field label="סוג שידור">
          <div className="h-11 px-3 inline-flex items-center rounded-btn bg-primary-soft text-primary text-sm font-medium border border-primary/20">
            יום עיון / אירוע תורני
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

        <Field
          label="פוסטר (קישור לתמונה / PDF)"
          hint="העלה ל-Google Drive / Dropbox והדבק את הקישור הישיר לתמונה או ל-PDF"
        >
          <input
            type="url"
            value={form.posterUrl}
            onChange={(e) => update("posterUrl", e.target.value)}
            className={inputCls}
            placeholder="https://drive.google.com/..."
            dir="ltr"
          />
          <p className="mt-1 flex items-start gap-1 text-xs text-ink-muted">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>בקרוב תוכל להעלות קובץ ישירות (מחכה ל-Cloudflare R2).</span>
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
          <Button type="submit" disabled={busy}>
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
