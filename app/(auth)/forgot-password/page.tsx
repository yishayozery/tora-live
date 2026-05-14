"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setBusy(false);
      // תמיד מציגים הצלחה (בטחון — לא מגלים אם המייל קיים או לא)
      setDone(true);
    } catch (e) {
      setBusy(false);
      setErr("שגיאת רשת — בדוק חיבור ונסה שוב.");
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-live mx-auto mb-3" />
        <h1 className="hebrew-serif text-2xl font-bold text-ink mb-2">בקשה התקבלה</h1>
        <p className="text-sm text-ink-soft mb-6">
          אם המייל קיים במערכת, הדריך בקשת איפוס נשלחה לאדמין שיצור עמך קשר תוך 24 שעות.
        </p>
        <Link href="/login" className="text-primary hover:underline text-sm">
          ← חזרה לכניסה
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="hebrew-serif text-3xl font-bold text-ink mb-2">שכחתי סיסמה</h1>
        <p className="text-sm text-ink-muted">נשלח קישור איפוס למייל שלך</p>
      </div>
      <div className="bg-white rounded-card shadow-soft border border-border p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm text-ink-soft mb-1.5 font-medium">מייל</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full h-11 ps-9 pe-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                dir="ltr"
              />
            </div>
          </div>
          {err && (
            <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-btn px-3 py-2">
              {err}
            </div>
          )}
          <Button type="submit" disabled={busy} size="lg" className="w-full">
            {busy ? "שולח..." : "שלח בקשת איפוס"}
          </Button>
        </form>
        <div className="mt-6 pt-5 border-t border-border text-center text-sm text-ink-muted">
          זכרת את הסיסמה? <Link href="/login" className="text-primary font-semibold hover:underline">חזרה לכניסה</Link>
        </div>
      </div>
    </div>
  );
}
