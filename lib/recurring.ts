// לוגיקת שיעור מחזורי — יצירת מופעים עתידיים מ-rule.
import { z } from "zod";

export const recurringRuleSchema = z.object({
  freq: z.enum(["DAILY", "WEEKLY"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=ראשון ... 6=שבת. חובה ל-WEEKLY
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  endDate: z.string().optional(), // ISO date string — אם לא מוגדר, 3 חודשים קדימה
});
export type RecurringRule = z.infer<typeof recurringRuleSchema>;

const DAY_NAMES_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function recurringLabel(rule: RecurringRule): string {
  const time = `${String(rule.hour).padStart(2, "0")}:${String(rule.minute).padStart(2, "0")}`;
  if (rule.freq === "DAILY") return `כל יום בשעה ${time}`;
  if (rule.freq === "WEEKLY" && rule.dayOfWeek != null) {
    return `כל יום ${DAY_NAMES_HE[rule.dayOfWeek]} בשעה ${time}`;
  }
  return `מחזורי בשעה ${time}`;
}

/**
 * מייצר רשימת תאריכים עתידיים לשיעור מחזורי.
 * @param rule הגדרת מחזוריות
 * @param fromDate מתי להתחיל (default: עכשיו)
 * @param maxOccurrences כמה מופעים ליצור (default: 12)
 */
export function generateOccurrences(
  rule: RecurringRule,
  fromDate?: Date,
  maxOccurrences = 12
): Date[] {
  const from = fromDate ?? new Date();
  const end = rule.endDate
    ? new Date(rule.endDate)
    : new Date(from.getTime() + 90 * 24 * 3600000); // 3 חודשים

  const dates: Date[] = [];
  const current = new Date(from);
  current.setHours(rule.hour, rule.minute, 0, 0);

  // אם הזמן היום כבר עבר, מתחיל ממחר
  if (current <= from) current.setDate(current.getDate() + 1);

  while (current <= end && dates.length < maxOccurrences) {
    if (rule.freq === "DAILY") {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    } else if (rule.freq === "WEEKLY") {
      // מוצאים את היום הבא שתואם dayOfWeek
      const targetDay = rule.dayOfWeek ?? 0;
      while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
      }
      if (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    }
  }
  return dates;
}
