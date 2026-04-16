import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm text-ink-soft">
        <div>
          <div className="hebrew-serif text-xl text-ink font-bold mb-2">TORA_LIVE</div>
          <p>פלטפורמת שיעורי תורה אונליין — הבית הדיגיטלי של רבני ישראל.</p>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">ניווט</div>
          <ul className="space-y-1">
            <li><Link href="/rabbis">רבנים</Link></li>
            <li><Link href="/lessons">שיעורים</Link></li>
            <li><Link href="/donate">תרומה</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">לרבנים</div>
          <ul className="space-y-1">
            <li><Link href="/rabbi/register">הרשמת רב</Link></li>
            <li><Link href="/login">כניסה</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-ink-muted py-4 border-t border-border">
        © {new Date().getFullYear()} TORA_LIVE · כל הזכויות שמורות
      </div>
    </footer>
  );
}
