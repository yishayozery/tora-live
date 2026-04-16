import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-primary">תורה</span>
          <span className="font-serif text-2xl font-bold text-gold">לייב</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="text-ink-muted hover:text-ink">בית</Link>
          <Link href="/rabbis" className="text-ink-muted hover:text-ink">רבנים</Link>
          <Link href="/lessons" className="text-ink-muted hover:text-ink">שיעורים</Link>
          <Link href="/donate" className="text-ink-muted hover:text-ink">תרומה</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">כניסה</Link>
          <Link href="/rabbi/register" className="btn-primary hidden sm:inline-flex">
            הרשמת רב
          </Link>
        </div>
      </div>
    </header>
  );
}
