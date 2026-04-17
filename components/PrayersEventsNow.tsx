import Link from "next/link";
import { BROADCAST_TYPES } from "@/lib/enums";
import {
  broadcastIcon,
  ACCENT_SOFT,
  ACCENT_TEXT,
} from "@/components/BroadcastTypeBadge";
import { db } from "@/lib/db";

export async function PrayersEventsNow() {
  // רק PRAYER + OTHER (כבר אחרי הצמצום ל-3 סוגים)
  const items = BROADCAST_TYPES.filter((b) => b.value !== "LESSON");

  // ספירה אמיתית מה-DB לשיעורים עתידיים (3 ימים) לכל סוג
  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 86400000);
  const counts: Record<string, number> = {};
  await Promise.all(
    items.map(async (b) => {
      counts[b.value] = await db.lesson.count({
        where: {
          broadcastType: b.value,
          isPublic: true,
          approvalStatus: "APPROVED",
          isSuspended: false,
          scheduledAt: { gte: now, lte: in3days },
          OR: [
            { rabbi: { status: "APPROVED", isBlocked: false } },
            { rabbiId: null },
          ],
        },
      });
    })
  );

  // תאימות legacy — ספירות של סוגים ישנים עוד בDB, נכלל תחת OTHER
  const legacyOther = await db.lesson.count({
    where: {
      broadcastType: {
        notIn: ["LESSON", "PRAYER", "OTHER"],
      },
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      scheduledAt: { gte: now, lte: in3days },
      rabbi: { status: "APPROVED", isBlocked: false },
    },
  });
  if (counts["OTHER"] !== undefined) counts["OTHER"] += legacyOther;

  return (
    <section className="max-w-6xl mx-auto px-4 mt-14">
      <div className="mb-5 text-center">
        <h2 className="hebrew-serif text-3xl font-bold text-ink">
          תפילות ואירועים <span className="text-primary">עכשיו</span>
        </h2>
        <p className="mt-2 text-ink-soft">
          לא רק שיעורים — תפילות, סליחות, אירועים, חופות וניגונים בשידור חי מכל הארץ.
        </p>
      </div>

      {/* 2 אייטמים בגודל בולט — grid 1 בממוד מובייל, 2 בדסקטופ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {items.map((b) => {
          const Icon = broadcastIcon(b.icon);
          const count = counts[b.value] ?? 0;
          return (
            <Link
              key={b.value}
              href={`/lessons?type=${b.value}`}
              aria-label={`${b.label} — ${count} שיעורים עתידיים`}
              className="group flex items-start gap-4 rounded-card border border-border bg-white p-5 transition hover:shadow-soft hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full shrink-0 ${ACCENT_SOFT[b.accent]}`}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink text-lg">{b.label}</div>
                <p className="text-sm text-ink-muted leading-snug mt-1">
                  {b.description}
                </p>
                <div
                  className={`mt-3 text-sm font-semibold ${ACCENT_TEXT[b.accent]}`}
                >
                  {count > 0 ? `${count} ב-3 הימים הקרובים` : "צפה במה שיש ←"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
