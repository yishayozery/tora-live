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
 * מתחזק תבניות פעילות: מאריך אוטומטית את לוח השיעורים +
 * זיהוי התנגשויות עם חגים ב-7 ימים הקרובים.
 *
 * נקרא מ-cron יומי. בטוח לקרוא לו פעם בשעה — לא ייצור כפילויות.
 *
 * החזר:
 *   - extended: כמה תבניות הוארכו (נוצרו שיעורים חדשים)
 *   - warned: רבנים שקיבלו התראת חגים
 *   - lessonsCreated: סה"כ שיעורים שנוצרו בריצה הזו
 */
export async function maintainRecurringTemplates(): Promise<{
  extended: number;
  warned: number;
  lessonsCreated: number;
  errors: string[];
}> {
  const result = { extended: 0, warned: 0, lessonsCreated: 0, errors: [] as string[] };
  const now = new Date();
  const extendUntil = new Date(now.getTime() + 30 * 86400_000);
  const warningWindowEnd = new Date(now.getTime() + 7 * 86400_000);
  const minWarningGap = 7 * 86400_000; // לא לשלוח התראה תוך 7 ימים מהתראה קודמת

  const templates = await db.recurringLessonTemplate.findMany({
    where: { status: "ACTIVE" },
    include: { rabbi: { include: { user: { select: { email: true } } } } },
  });

  for (const t of templates) {
    try {
      // 1. הארכה: אם יש פער בין lastGeneratedUntil ל-now+30, צור שיעורים בפער
      const fromGenerate = t.lastGeneratedUntil
        ? new Date(Math.max(t.lastGeneratedUntil.getTime() + 1, now.getTime()))
        : new Date(t.startDate.getTime());
      const toGenerate = new Date(Math.min(extendUntil.getTime(), t.endDate.getTime()));

      if (fromGenerate < toGenerate) {
        const r = await generateLessonsForTemplate(t.id, fromGenerate, toGenerate);
        if (r.created > 0) {
          result.extended++;
          result.lessonsCreated += r.created;
        }
      }

      // 2. התראת חגים — רק אם לא שלחנו ב-7 ימים האחרונים
      const lastWarnedAgo = (t as any).lastHolidayWarningAt
        ? now.getTime() - (t as any).lastHolidayWarningAt.getTime()
        : Infinity;
      if (lastWarnedAgo < minWarningGap) continue;

      // מצא התנגשויות חגים בתבנית הזו ב-7 ימים
      const conflicts = await getUpcomingHolidayConflicts(t.rabbiId, 7);
      const myConflicts = conflicts.filter((c) => c.templateTitle === t.title);
      if (myConflicts.length === 0) continue;

      // שלח התראה
      const email = t.rabbi.user?.email;
      if (email) {
        await sendHolidayWarningEmail(email, t.rabbi.name, t.title, myConflicts);
      }
      await db.recurringLessonTemplate.update({
        where: { id: t.id },
        data: { lastHolidayWarningAt: now } as any,
      });
      result.warned++;
    } catch (e: any) {
      result.errors.push(`${t.title}: ${e.message}`);
    }
  }

  return result;
}

async function sendHolidayWarningEmail(
  email: string,
  rabbiName: string,
  templateTitle: string,
  conflicts: { date: Date; holiday: string; time: string }[],
) {
  const { Resend } = await import("resend");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[holiday-warning] no RESEND_API_KEY, skipping email to ${email}`);
    return;
  }
  const resend = new Resend(apiKey);
  const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "TORA_LIVE";

  const { formatHebrewDateLetters } = await import("@/lib/utils");
  const conflictRows = conflicts.map((c) => {
    const dateHe = formatHebrewDateLetters(c.date, false);
    const dateGr = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" }).format(c.date);
    return `<li><strong>${c.holiday}</strong> — ${dateHe} (${dateGr}) ב-${c.time}</li>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>חגים בשבוע הקרוב</title></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#F7F8FA; margin:0; padding:24px; color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:28px;">
    <div style="border-bottom:1px solid #E5E7EB;padding-bottom:12px;margin-bottom:20px;">
      <span style="font-size:20px;font-weight:bold;color:#1E40AF;">TORA_LIVE</span>
    </div>
    <p style="margin:0 0 6px;color:#64748B;font-size:14px;">שלום ${rabbiName},</p>
    <h2 style="margin:0 0 12px;font-size:22px;color:#0F172A;">בשבוע הקרוב יש חגים שמתנגשים עם הסדרה "${templateTitle}"</h2>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">השיעורים הבאים יידלגו אוטומטית בגלל החג:</p>
    <ul style="font-size:15px;line-height:1.8;color:#0F172A;padding-inline-start:20px;">${conflictRows}</ul>
    <p style="margin:20px 0 12px;font-size:14px;color:#334155;">אם תרצה להעביר ליום אחר — היכנס לדשבורד ועדכן את השיעור הספציפי.</p>
    <a href="https://tora-live.co.il/dashboard/lessons/recurring" style="display:inline-block;background:#1E40AF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">לדשבורד שלי ←</a>
    <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;border-top:1px solid #E5E7EB;padding-top:16px;">
      התראה אוטומטית על חגים בשבוע הקרוב. תקבל אותה רק פעם בשבוע, אפילו אם יש חגים נוספים.
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
    to: email,
    subject: `התראה: ${conflicts.length === 1 ? "חג בשבוע הקרוב" : `${conflicts.length} חגים בשבוע הקרוב`} — ${templateTitle}`,
    html,
  });
}

/**
 * מעדכן תבנית קיימת ומחדש את השיעורים העתידיים (מלבד אלה שנערכו ידנית).
 */
export async function updateTemplate(
  templateId: string,
  rabbiId: string,
  updates: {
    title?: string;
    description?: string;
    categoryId?: string | null;
    language?: string;
    broadcastType?: string;
    isPublic?: boolean;
    schedule?: string; // JSON
    startDate?: Date;
    endDate?: Date;
  },
): Promise<{ updated: boolean; deletedFutureLessons: number; created: number }> {
  // וודא שהתבנית של הרב הזה
  const existing = await db.recurringLessonTemplate.findUnique({ where: { id: templateId } });
  if (!existing || existing.rabbiId !== rabbiId) {
    throw new Error("Template not found or not owned by rabbi");
  }

  // עדכן את התבנית
  await db.recurringLessonTemplate.update({
    where: { id: templateId },
    data: updates as any,
  });

  // מחק שיעורים עתידיים שלא נערכו ידנית — נוצור אותם מחדש לפי התבנית החדשה
  const now = new Date();
  const deleted = await db.lesson.deleteMany({
    where: {
      templateId,
      scheduledAt: { gte: now },
      manuallyEdited: false,
    } as any,
  });

  // אפס lastGeneratedUntil כדי שייווצרו מחדש
  await db.recurringLessonTemplate.update({
    where: { id: templateId },
    data: { lastGeneratedUntil: null } as any,
  });

  // ייצר את השיעורים מחדש — מהיום עד endDate (או 30 יום, המוקדם יותר)
  const updated = await db.recurringLessonTemplate.findUnique({ where: { id: templateId } });
  if (!updated) throw new Error("Template disappeared");
  const generateUntil = new Date(Math.min(
    updated.endDate.getTime(),
    now.getTime() + 30 * 86400_000,
  ));
  const result = await generateLessonsForTemplate(templateId, now, generateUntil);

  return {
    updated: true,
    deletedFutureLessons: deleted.count,
    created: result.created,
  };
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
