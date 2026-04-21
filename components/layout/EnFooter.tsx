import Link from "next/link";

export function EnFooter() {
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-4 text-sm text-ink-soft">
        <div className="sm:col-span-2">
          <div className="hebrew-serif text-xl text-ink font-bold mb-2">TORA_LIVE</div>
          <p className="max-w-md">
            The digital home of Israel&apos;s rabbis — thousands of Torah lessons, live broadcasts
            and schedules, accessible to everyone, free of charge.
          </p>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">Navigate</div>
          <ul className="space-y-1">
            <li><Link href="/en" className="hover:text-ink transition">Home</Link></li>
            <li><Link href="/en/about" className="hover:text-ink transition">About</Link></li>
            <li><Link href="/en/donate" className="hover:text-ink transition">Donate</Link></li>
            <li><Link href="/" className="hover:text-ink transition"><span lang="he" dir="rtl" className="hebrew-serif">עברית</span></Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">Contact</div>
          <ul className="space-y-1">
            <li><a href="mailto:info@tora-live.co.il" className="hover:text-ink transition">info@tora-live.co.il</a></li>
            <li><a href="https://tora-live.co.il" className="hover:text-ink transition">tora-live.co.il</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-ink-muted py-4 border-t border-border">
        © {new Date().getFullYear()} TORA_LIVE · All rights reserved
      </div>
    </footer>
  );
}
