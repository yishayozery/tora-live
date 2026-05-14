"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

// תרגום קודי שגיאה מ-auth.ts לעברית קריאה
function errorMessage(code: string | undefined | null): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "מייל או סיסמה שגויים. בדוק את הפרטים ונסה שוב.";
    case "RABBI_BLOCKED":
      return "החשבון שלך הושעה ע״י האדמין. פנה למייל admin@tora-live.co.il לבירור.";
    case "MISSING_FIELDS":
      return "נא למלא מייל וסיסמה.";
    case "CredentialsSignin":
    default:
      return "מייל או סיסמה שגויים.";
  }
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // האם Google OAuth זמין בסביבה (מוגדר ב-env בצד-שרת ונחשף ב-NEXT_PUBLIC)
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";

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
      setErr(errorMessage(res.error));
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-ink-soft font-medium">סיסמה</label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                שכחתי סיסמה
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 ps-3 pe-11 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-2 rounded-btn text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={showPassword ? "הסתר סיסמה" : "הראה סיסמה"}
                title={showPassword ? "הסתר סיסמה" : "הראה סיסמה"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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

        {googleEnabled && (
          <>
            <div className="flex items-center gap-2 my-5">
              <div className="flex-1 h-px bg-border" aria-hidden />
              <span className="text-xs text-ink-muted">או</span>
              <div className="flex-1 h-px bg-border" aria-hidden />
            </div>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: sp.get("next") || sp.get("callbackUrl") || "/my/schedule" })}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-btn border border-border bg-white text-ink font-medium hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-1.9 1.4-4.4 2.3-7.5 2.3-5 0-9.5-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.5 5.5C40.7 35.2 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              <span>התחבר עם Google</span>
            </button>
          </>
        )}

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
