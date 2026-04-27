"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-ink-muted py-10">טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setErr("פרטי כניסה שגויים או חשבון חסום");
      return;
    }
    // Redirect based on role — תומך גם ב-?next= וגם ב-?callbackUrl=
    const next = sp.get("next") || sp.get("callbackUrl");
    if (next && next.startsWith("/")) {
      router.push(next);
    } else {
      // Fetch session to know role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      const adminEmail = session?.user?.email?.toLowerCase();

      if (adminEmail === "admin@tora-live.co.il" || role === "ADMIN") {
        router.push("/admin");
      } else if (role === "RABBI") {
        router.push("/dashboard");
      } else {
        router.push("/my/schedule");
      }
    }
    router.refresh();
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="hebrew-serif text-3xl font-bold text-ink mb-2">ברוכים הבאים</h1>
        <p className="text-sm text-ink-muted">הכנס לחשבונך להמשיך ללמוד</p>
      </div>

      <div className="bg-white rounded-card shadow-soft border border-border p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-ink-soft mb-1.5 font-medium">מייל</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1.5 font-medium">סיסמה</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          {err && (
            <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-btn px-3 py-2">
              {err}
            </div>
          )}
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "מתחבר..." : "התחבר"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-sm text-ink-muted space-y-2">
          <div>
            אין לך חשבון? <Link href="/register" className="text-primary font-semibold hover:underline">הרשמה כתלמיד</Link>
          </div>
          <div className="text-xs">
            רב? <Link href="/rabbi/register" className="text-primary hover:underline">הרשמת רב</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
