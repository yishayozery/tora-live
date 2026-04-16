import Link from "next/link";
import { BROADCAST_TYPES } from "@/lib/enums";
import {
  broadcastIcon,
  ACCENT_SOFT,
  ACCENT_TEXT,
} from "@/components/BroadcastTypeBadge";

// Mock — כמות שיעורים עתידיים (3 הימים הקרובים) לכל סוג שידור שאינו LESSON.
// TODO phase1: להחליף בסכימת SELECT מ-DB על פי broadcastType.
const MOCK_COUNTS: Record<string, number> = {
  PRAYER: 24,
  SELICHOT: 6,
  TEHILLIM: 18,
  HESPED: 2,
  WEDDING: 4,
  BAR_MITZVAH: 3,
  NIGGUN: 5,
  CHAZANUT: 7,
  EVENT: 9,
  KOL_NIDREI: 1,
  SHIUR_KLALI: 11,
};

export function PrayersEventsNow() {
  const items = BROADCAST_TYPES.filter((b) => b.value !== "LESSON");

  return (
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <div className="mb-5 text-center">
        <h2 className="hebrew-serif text-3xl font-bold text-ink">
          תפילות ואירועים <span className="text-primary">עכשיו</span>
        </h2>
        <p className="mt-2 text-ink-soft">
          לא רק שיעורים — סליחות, תפילות, הספדים, שמחות וניגונים בשידור חי מכל
          הארץ.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((b) => {
          const Icon = broadcastIcon(b.icon);
          const count = MOCK_COUNTS[b.value] ?? 0;
          return (
            <Link
              key={b.value}
              href={`/lessons?type=${b.value}`}
              aria-label={`${b.label} — ${count} שיעורים עתידיים`}
              className="group flex flex-col items-start gap-2 rounded-card border border-border bg-white p-4 transition hover:shadow-soft hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${ACCENT_SOFT[b.accent]}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="font-bold text-ink">{b.label}</div>
              <div className="text-xs text-ink-muted leading-snug">
                {b.description}
              </div>
              <div
                className={`mt-auto text-xs font-semibold ${ACCENT_TEXT[b.accent]}`}
              >
                {count} ב-3 הימים הקרובים ←
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
