import Link from "next/link";
import type { MockRabbi } from "@/lib/mock-data";

export function RabbiCard({ rabbi }: { rabbi: MockRabbi }) {
  const initials = rabbi.displayName.split(" ").slice(-1)[0]?.[0] ?? "?";
  return (
    <Link href={`/rabbi/${rabbi.slug}`} className="card group block p-5 transition hover:border-primary/40">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-2xl font-bold text-gold">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-bold text-ink group-hover:text-primary">
            {rabbi.displayName}
          </h3>
          <p className="line-clamp-1 text-xs text-ink-subtle">
            {rabbi.totalLessons} שיעורים · {rabbi.totalHours} שעות
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{rabbi.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {rabbi.categories.slice(0, 3).map((c) => (
          <span key={c} className="pill">{c}</span>
        ))}
      </div>
    </Link>
  );
}
