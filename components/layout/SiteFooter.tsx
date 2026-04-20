import Link from "next/link";
import { Accessibility } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-4 text-sm text-ink-soft">
        <div>
          <div className="hebrew-serif text-xl text-ink font-bold mb-2">TORA_LIVE</div>
          <p>פלטפורמת שיעורי תורה אונליין — הבית הדיגיטלי של רבני ישראל.</p>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">ניווט</div>
          <ul className="space-y-1">
            <li><Link href="/rabbis" className="hover:text-ink transition">רבנים</Link></li>
            <li><Link href="/lessons" className="hover:text-ink transition">שיעורים</Link></li>
            <li><Link href="/donate" className="hover:text-ink transition">תרומה</Link></li>
            <li><Link href="/contact" className="hover:text-ink transition">צור קשר</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">לרבנים</div>
          <ul className="space-y-1">
            <li><Link href="/rabbi/register" className="hover:text-ink transition">הרשמת רב</Link></li>
            <li><Link href="/login" className="hover:text-ink transition">כניסה</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">מידע</div>
          <ul className="space-y-1">
            <li><Link href="/terms" className="hover:text-ink transition">תנאי שימוש</Link></li>
            <li>
              <Link href="/accessibility" className="hover:text-ink transition inline-flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5" />
                הצהרת נגישות
              </Link>
            </li>
            <li><Link href="/about" className="hover:text-ink transition">אודות</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-ink-muted py-4 border-t border-border">
        © {new Date().getFullYear()} TORA_LIVE · כל הזכויות שמורות
      </div>
    </footer>
  );
}
