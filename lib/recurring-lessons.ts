/**
 * לוגיקה לייצור שיעורים מתבנית קבועה.
 * - דולג שבת אוטומטית (יום 6 ב-getDay)
 * - דולג חגים מ-hebrew-dates.ts (מכניסה ועד יציאה)
 * - לא דורס שיעורים שעודכנו ידנית
 */
import { db } from "@/lib/db";
import { getHebrewHoliday } from "@/lib/hebrew-dates";

export type DaySchedule = {
  enabled: boolean;
  time?: string; // "HH:MM"
  durationMin?: number;
};

export type WeekSchedule = {
  sun: DaySchedule;
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule; // תמיד disabled
};

const DAY_KEYS: (keyof WeekSchedule)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function parseSchedule(json: string): WeekSchedule {
  try {
    return JSON.parse(json);
  } catch {
    return {
      sun: { enabled: false },
      mon: { enabled: false },
      tue: { enabled: false },
      wed: { enabled: false },
      thu: { enabled: false },
      fri: { enabled: false },
      sat: { enabled: false },
    };
  }
}

/**
 * מייצר שיעורים מתבנית בטווח [from, to].
 * דולג שבת + חגים. לא יוצר כפילות (בודק templateId + scheduledAt).
 * מחזיר: { created, skippedShabbat, skippedHoliday, holidayConflicts }
 */
export async function generateLessonsForTemplate(
  templateId: string,
  from: Date,
  to: Date,
): Promise<{
  created: number;
  skippedShabbat: number;
  skippedHoliday: number;
  holidayConflicts: { date: Date; holiday: string }[];
}> {
  const template = await db.recurringLessonTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template || template.status !== "ACTIVE") {
    return { created: 0, skippedShabbat: 0, skippedHoliday: 0, holidayConflicts: [] };
  }

  const schedule = parseSchedule(template.schedule);

  // קח את כל ה-scheduledAt הקיימים בטווח כדי למנוע כפילויות
  const existing = await db.lesson.findMany({
    where: {
      templateId,
      scheduledAt: { gte: from, lte: to },
    },
    select: { scheduledAt: true },
  });
  const existingTimes = new Set(existing.map((l) => l.scheduledAt.toISOString()));

  let created = 0;
  let skippedShabbat = 0;
  let skippedHoliday = 0;
  const holidayConflicts: { date: Date; holiday: string }[] = [];

  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0=Sun...6=Sat
    const dayKey = DAY_KEYS[dayOfWeek];
    const daySchedule = schedule[dayKey];

    // שבת — תמיד מדלג
    if (dayOfWeek === 6) {
      if (daySchedule?.enabled) skippedShabbat++;
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    if (!daySchedule?.enabled || !daySchedule.time) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    // חג — מדלג + מסמן conflict
    const holiday = getHebrewHoliday(cur);
    if (holiday) {
      skippedHoliday++;
      holidayConflicts.push({ date: new Date(cur), holiday });
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    // מבנה התאריך עם השעה
    const [hours, minutes] = daySchedule.time.split(":").map(Number);
    const scheduledAt = new Date(cur);
    scheduledAt.setHours(hours, minutes, 0, 0);

    if (existingTimes.has(scheduledAt.toISOString())) {
      // כבר קיים — לא יוצרים שוב
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    await db.lesson.create({
      data: {
        rabbiId: template.rabbiId,
        title: template.title,
        description: template.description || template.title,
        scheduledAt,
        durationMin: daySchedule.durationMin ?? 60,
        broadcastType: template.broadcastType,
        language: template.language,
        isPublic: template.isPublic,
        approvalStatus: "APPROVED",
        categoryId: template.categoryId,
        isRecurring: true,
        templateId: template.id,
      } as any,
    });
    created++;

    cur.setDate(cur.getDate() + 1);
  }

  // עדכן את lastGeneratedUntil
  await db.recurringLessonTemplate.update({
    where: { id: templateId },
    data: { lastGeneratedUntil: end } as any,
  });

  return { created, skippedShabbat, skippedHoliday, holidayConflicts };
}

/**
 * מחזיר את התנגשויות החגים הקרובות (לתצוגת התראה לרב).
 */
export async function getUpcomingHolidayConflicts(
  rabbiId: string,
  daysAhead: number = 14,
): Promise<{ date: Date; holiday: string; templateTitle: string; dayOfWeek: number; time: string }[]> {
  const templates = await db.recurringLessonTemplate.findMany({
    where: { rabbiId, status: "ACTIVE" },
  });
  if (templates.length === 0) return [];

  const conflicts: { date: Date; holiday: string; templateTitle: string; dayOfWeek: number; time: string }[] = [];
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 86400_000);

  for (const t of templates) {
    const schedule = parseSchedule(t.schedule);
    const cur = new Date(now);
    cur.setHours(0, 0, 0, 0);

    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const dayKey = DAY_KEYS[dayOfWeek];
      const daySchedule = schedule[dayKey];

      if (daySchedule?.enabled && daySchedule.time && dayOfWeek !== 6) {
        const holiday = getHebrewHoliday(cur);
        if (holiday) {
          conflicts.push({
            date: new Date(cur),
            holiday,
            templateTitle: t.title,
            dayOfWeek,
            time: daySchedule.time,
          });
        }
      }

      cur.setDate(cur.getDate() + 1);
    }
  }

  conflicts.sort((a, b) => a.date.getTime() - b.date.getTime());
  return conflicts;
}

/**
 * מבטל סדרת שיעורים — מסמן status=CANCELLED + מוחק שיעורים עתידיים שלא נערכו ידנית.
 */
export async function cancelTemplate(templateId: string, deleteFutureLessons: boolean = true): Promise<number> {
  await db.recurringLessonTemplate.update({
    where: { id: templateId },
    data: { status: "CANCELLED" },
  });

  if (!deleteFutureLessons) return 0;

  const result = await db.lesson.deleteMany({
    where: {
      templateId,
      scheduledAt: { gte: new Date() },
      manuallyEdited: false,
    } as any,
  });
  return result.count;
}
