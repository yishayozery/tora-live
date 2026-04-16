"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default function RabbiRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

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
