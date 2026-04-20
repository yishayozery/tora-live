/**
 * Auto-close lessons that have been "live" too long.
 *
 * רב סיים שיעור אבל לא לחץ "סיים" → השיעור נשאר isLive=true.
 * הסקריפט הזה רץ כל שעה ומסיים שיעורים תקועים.
 *
 * חוקי סגירה:
 * 1. אם עבר > durationMin × 2 + 30 דק' מ-scheduledAt → סגור
 * 2. אם אין durationMin → סגור אחרי 4 שעות מ-scheduledAt
 * 3. אם liveMethod=YOUTUBE → אל תיגע (detect-live מטפל)
 *
 * תמיד יוצר התראה ל-admin עם רשימת השיעורים שנסגרו אוטומטית.
 */
import { db } from "@/lib/db";

export type AutoCloseResult = {
  scanned: number;
  closed: number;
  warnings: string[];  // שיעורים שעדיין חיים אבל קרובים לסגירה
  errors: string[];
  closedLessons: { id: string; title: string; rabbi?: string; reason: string }[];
};

export async function runAutoClose(opts: { dryRun?: boolean } = {}): Promise<AutoCloseResult> {
  const result: AutoCloseResult = {
    scanned: 0,
    closed: 0,
    warnings: [],
    errors: [],
    closedLessons: [],
  };

  const now = Date.now();

  // שלוף את כל השיעורים שהם isLive=true (לא YouTube — את אלה detect-live סוגר)
  const liveLessons = await db.lesson.findMany({
    where: {
      isLive: true,
      OR: [
        { liveMethod: { not: "YOUTUBE" } },
        { liveMethod: null },
      ],
      // אל תיגע בשידורי 24/7 כמו הכותל — externalId מתחיל ב-kotel-
      NOT: { externalId: { startsWith: "kotel-" } },
    },
    include: { rabbi: { select: { name: true } } },
  });

  result.scanned = liveLessons.length;

  for (const l of liveLessons) {
    const scheduledMs = l.scheduledAt.getTime();
    const durationMs = (l.durationMin ?? 60) * 60 * 1000;
    const cutoffMs = scheduledMs + durationMs * 2 + 30 * 60 * 1000;  // 2× duration + 30 דק' grace
    const fallbackCutoff = scheduledMs + 4 * 60 * 60 * 1000;  // 4 שעות אחרי scheduledAt
    const cutoff = l.durationMin ? cutoffMs : fallbackCutoff;

    if (now < cutoff) {
      // עוד לא הגיע הזמן — אבל אם קרוב (תוך 30 דק') — אזהרה
      if (now > cutoff - 30 * 60 * 1000) {
        result.warnings.push(`${l.title} (${l.rabbi?.name ?? "—"}) — ייסגר אוטומטית בעוד <30 דק'`);
      }
      continue;
    }

    // סגור!
    const reason = `נסגר אוטומטית — עבר ${Math.round((now - scheduledMs) / 60000)} דק' מהזמן המתוזמן (משך מתוכנן: ${l.durationMin ?? "—"} דק')`;

    if (!opts.dryRun) {
      try {
        await db.lesson.update({
          where: { id: l.id },
          data: {
            isLive: false,
            // אם יש playbackUrl נשמור אותו, אחרת נשמור את ה-liveEmbedUrl ל-watching later
            playbackUrl: l.playbackUrl ?? l.liveEmbedUrl ?? l.youtubeUrl ?? null,
          },
        });
        result.closed++;
        result.closedLessons.push({
          id: l.id,
          title: l.title,
          rabbi: l.rabbi?.name,
          reason,
        });
      } catch (e: any) {
        result.errors.push(`${l.title}: ${e.message}`);
      }
    } else {
      result.closed++;
      result.closedLessons.push({ id: l.id, title: l.title, rabbi: l.rabbi?.name, reason });
    }
  }

  return result;
}
