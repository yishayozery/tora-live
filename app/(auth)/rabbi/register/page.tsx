"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Camera, X, Upload } from "lucide-react";

const MAX_PHOTO_BYTES = 600 * 1024; // 600KB

export default function RabbiRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", photoUrl: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoMode, setPhotoMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("יש להעלות קובץ תמונה בלבד");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErr(`התמונה גדולה מדי (${(file.size / 1024).toFixed(0)}KB). מקסימום 600KB. נסה לכווץ ב-tinypng.com`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/register/rabbi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה ברישום");
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <Card className="text-center">
        <div className="flex justify-center mb-3">
          <CheckCircle2 className="w-14 h-14 text-live" />
        </div>
        <CardTitle>הבקשה נשלחה</CardTitle>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          קיבלנו את פרטיך. אדמין יבדוק את הבקשה ותקבל מייל כשהחשבון יאושר.
          <br />
          לאחר האישור תוכל להשלים את הפרופיל (תיאור, קישורים למדיה, תמונה) ולהעלות שיעורים.
        </p>
        <Link href="/" className="inline-block mt-6 text-primary">חזרה לעמוד הבית</Link>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>הרשמת רב</CardTitle>
      <p className="text-sm text-ink-muted mb-5">
        הרשמה מהירה ב-30 שניות. לאחר אישור אדמין תשלים את הפרופיל ותתחיל להעלות שיעורים.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <F label="שם מלא">
          <input
            required minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="לדוגמה: הרב יוסף כהן"
          />
        </F>
        <F label="מייל">
          <input
            type="email" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input" dir="ltr"
          />
        </F>
        <F label="סיסמה">
          <input
            type="password" required minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
          />
          <p className="text-xs text-ink-muted mt-1">לפחות 6 תווים</p>
        </F>
        <F label="טלפון (לא יחשף לציבור)">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input" dir="ltr"
            placeholder="0501234567"
          />
          <p className="text-xs text-ink-muted mt-1">אופציונלי — לצורך יצירת קשר מהאדמין בלבד</p>
        </F>

        {/* תמונת פרופיל */}
        <F label="תמונת פרופיל (אופציונלי)">
          {form.photoUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.photoUrl}
                alt="תצוגה מקדימה"
                className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-soft"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, photoUrl: "" }))}
                className="inline-flex items-center gap-1 text-sm text-danger hover:underline"
              >
                <X className="w-4 h-4" /> הסר תמונה
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPhotoMode("upload")}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    photoMode === "upload" ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft"
                  }`}
                >
                  העלאת קובץ
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode("url")}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    photoMode === "url" ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft"
                  }`}
                >
                  הדבקת קישור
                </button>
              </div>
              {photoMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border rounded-btn flex flex-col items-center justify-center gap-1 hover:bg-paper-soft transition"
                  >
                    <Upload className="w-5 h-5 text-ink-muted" />
                    <span className="text-sm text-ink-soft">לחץ לבחירת תמונה</span>
                    <span className="text-[11px] text-ink-muted">JPG/PNG, עד 600KB</span>
                  </button>
                </div>
              ) : (
                <input
                  type="url"
                  value={form.photoUrl.startsWith("data:") ? "" : form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="input"
                  dir="ltr"
                  placeholder="https://example.com/photo.jpg"
                />
              )}
              <p className="text-xs text-ink-muted mt-1">
                <Camera className="inline w-3 h-3 ml-1" />
                תמונת פנים מומלצת. תוצג בדף האישי שלך ובכרטיסי שיעורים.
              </p>
            </>
          )}
        </F>

        {err && <div className="text-sm text-danger">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "שולח..." : "שלח בקשה לאישור"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-ink-muted">
        כבר רשום? <Link href="/login" className="text-primary">כניסה</Link>
      </p>
      <style jsx>{`.input { width: 100%; height: 2.75rem; padding: 0 .75rem; border-radius: 10px; border: 1px solid #E5E7EB; background: white; }`}</style>
    </Card>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-ink-soft mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
