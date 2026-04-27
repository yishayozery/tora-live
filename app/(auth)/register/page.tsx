"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-ink-muted py-10">טוען...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ?next= להמשיך לעמוד שאליו רצינו (לדוגמה /ask-rabbi)
  const next = sp.get("next") || sp.get("callbackUrl");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/register/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה ברישום");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>הרשמה כתלמיד</CardTitle>
      <p className="text-sm text-ink-muted mb-4">חינם. מאפשר לשאול שאלות בצ׳אט ולפנות לרבנים.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="שם מלא">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label="מייל">
          <input type="email" required dir="ltr" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
        </Field>
        <Field label="סיסמה">
          <input type="password" required minLength={6} dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
        </Field>
        {err && <div className="text-sm text-danger">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "נרשם..." : "הירשם"}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-ink-muted">
        כבר רשום? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary">כניסה</Link>
      </div>
      <style jsx>{`.input { width: 100%; height: 2.75rem; padding: 0 .75rem; border-radius: 10px; border: 1px solid #E5E7EB; background: white; }`}</style>
    </Card>
  );
}

// helper-style component already used above
// (kept to avoid restructuring, no functional change)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
