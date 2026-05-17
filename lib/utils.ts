import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * המרת מספר לאותיות עבריות (גימטריה).
 * 1 → "א׳", 15 → "ט״ו", 25 → "כ״ה", 786 → "תשפ״ו"
 */
export function toHebrewNumeral(n: number): string {
  if (n < 1 || n > 999) return String(n);
  // מקרים מיוחדים: 15, 16 — לא יה/יו (כדי לא לכתוב את שם ה').
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";

  const values: [number, string][] = [
    [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"],
    [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"],
    [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"],
    [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"],
    [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
  ];
  let result = "";
  let remaining = n;
  for (const [val, letter] of values) {
    while (remaining >= val) {
      result += letter;
      remaining -= val;
    }
  }
  // החלפת אות סופית (כ→ך, מ→ם, נ→ן, פ→ף, צ→ץ) — נדיר אבל סטנדרטי
  // לתאריך לא נהוג, נשאיר כמו שזה
  // הוספת geresh (אות אחת) או gershayim (לפני האחרונה)
  if (result.length === 1) return result + "׳";
  return result.slice(0, -1) + "״" + result.slice(-1);
}

/**
 * תאריך עברי באותיות (גימטריה ידנית — כי Node.js Intl לא תומך תמיד ב-nu-hebr).
 * דוגמה: Date(2026-04-27) → "ט׳ באייר תשפ״ו"
 */
export function formatHebrewDateLetters(d: Date | string, withYear: boolean = true): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    // timeZone מפורש — אחרת שיעור שמתחיל ב-20:00 ישראל ייחשב 17:00 UTC = יום קודם
    const dayStr = new Intl.DateTimeFormat("en-US-u-ca-hebrew", { day: "numeric", timeZone: "Asia/Jerusalem" }).format(date);
    const monthStr = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long", timeZone: "Asia/Jerusalem" }).format(date);
    const yearStr = new Intl.DateTimeFormat("en-US-u-ca-hebrew", { year: "numeric", timeZone: "Asia/Jerusalem" }).format(date);
    const day = parseInt(dayStr, 10);
    const yearNum = parseInt(yearStr, 10);
    if (!isFinite(day) || !isFinite(yearNum)) return "";
    const dayHe = toHebrewNumeral(day);
    // שנה: 5786 → 786 → תשפ״ו (מקצרים את האלפים, סטנדרטי)
    const yearShort = yearNum % 1000;
    const yearHe = toHebrewNumeral(yearShort);
    if (withYear) {
      return `${dayHe} ב${monthStr} ${yearHe}`;
    }
    return `${dayHe} ב${monthStr}`;
  } catch {
    return "";
  }
}

/**
 * עברי קצר עם יום בשבוע: "יום ראשון, ט׳ באייר".
 */
export function formatHebrewDateWithWeekday(d: Date | string, withYear: boolean = false): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    const wd = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);
    const main = formatHebrewDateLetters(date, withYear);
    return main ? `יום ${wd}, ${main}` : "";
  } catch {
    return "";
  }
}

/**
 * תאריך עברי כראשי — אותיות עבריות (לא מספרים).
 * דוגמה: "ט׳ באייר תשפ״ו · 27 באפריל 2026"
 */
export function formatHebrewDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const hebrew = formatHebrewDateLetters(date, true);
  const gregorian = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(date);
  return hebrew ? `${hebrew} · ${gregorian}` : gregorian;
}

/**
 * תאריך לועזי בלבד — לשימושים טכניים (לוגים, ייצוא וכו׳).
 */
export function formatGregorianDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}

/**
 * מחזיר טווח שעות כ-"09:00-17:00" (עבור אירועים ארוכים),
 * או שעת התחלה בלבד "09:00" (לשיעורים קצרים, < 90 דק').
 */
export function formatTimeRange(scheduledAt: Date | string, durationMin: number | null | undefined): string {
  const start = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const fmt = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" });
  const startStr = fmt.format(start);
  if (!durationMin || durationMin < 90) return startStr;
  const end = new Date(start.getTime() + durationMin * 60_000);
  return `${startStr}–${fmt.format(end)}`;
}

/**
 * Hebrew pluralization helper.
 * pluralize(1, "שיעור", "שיעורים") → "שיעור אחד"
 * pluralize(2, "שיעור", "שיעורים") → "שני שיעורים"
 * pluralize(5, "שיעור", "שיעורים") → "5 שיעורים"
 * pluralize(0, "שיעור", "שיעורים") → "אין שיעורים"
 */
export function pluralize(
  n: number,
  singular: string,
  plural: string,
  feminine = false,
): string {
  if (n === 0) return `אין ${plural}`;
  if (n === 1) return `${singular} ${feminine ? "אחת" : "אחד"}`;
  if (n === 2) return `שני ${plural}`;
  return `${n.toLocaleString("he-IL")} ${plural}`;
}

export function formatHebrewTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  // timeZone מפורש — מונע סטייה כש-Vercel רץ ב-UTC (היה מציג 08:52 במקום 11:52)
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}
