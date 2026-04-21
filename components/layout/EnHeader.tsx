import Link from "next/link";
import { LogoIcon } from "@/components/Logo";

export function EnHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/en" className="flex items-center gap-2 group">
          <LogoIcon className="w-8 h-8 text-primary" />
          <span className="hebrew-serif text-xl font-bold text-ink group-hover:text-primary transition">
            TORA_LIVE
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/en/about" className="text-ink-soft hover:text-ink transition hidden sm:inline">
            About
          </Link>
          <Link href="/en/donate" className="text-ink-soft hover:text-ink transition hidden sm:inline">
            Donate
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-paper-soft border border-border text-ink-soft hover:text-ink hover:border-primary transition text-xs font-medium"
            title="עבור לעברית"
          >
            <span lang="he" dir="rtl" className="hebrew-serif">עברית</span>
            <span>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
