/**
 * hebrew-dates.ts
 * מילון חגים וצומות עבריים לשנים 2026-2027 (תשפ"ו-תשפ"ז-תשפ"ח)
 * הנתונים hardcoded — לא צריך ספרייה חיצונית.
 */

type HolidayEntry = {
  /** Gregorian YYYY-MM-DD */
  date: string;
  name: string;
};

// --- חגים תשפ"ו (2025-2026) ---
// --- חגים תשפ"ז (2026-2027) ---
// --- חגים תשפ"ח (2027-2028) ---
const HOLIDAYS: HolidayEntry[] = [
  // ========== תשפ"ו (2025-2026) ==========
  // ראש השנה
  { date: "2025-09-23", name: "ראש השנה א׳" },
  { date: "2025-09-24", name: "ראש השנה ב׳" },
  // צום גדליה
  { date: "2025-09-25", name: "צום גדליה" },
  // יום כיפור
  { date: "2025-10-02", name: "יום כיפור" },
  // סוכות
  { date: "2025-10-07", name: "סוכות א׳" },
  { date: "2025-10-08", name: "סוכות ב׳" },
  { date: "2025-10-09", name: "חול המועד סוכות" },
  { date: "2025-10-10", name: "חול המועד סוכות" },
  { date: "2025-10-11", name: "חול המועד סוכות" },
  { date: "2025-10-12", name: "חול המועד סוכות" },
  { date: "2025-10-13", name: "הושענא רבה" },
  { date: "2025-10-14", name: "שמיני עצרת" },
  // חנוכה
  { date: "2025-12-15", name: "חנוכה א׳" },
  { date: "2025-12-16", name: "חנוכה ב׳" },
  { date: "2025-12-17", name: "חנוכה ג׳" },
  { date: "2025-12-18", name: "חנוכה ד׳" },
  { date: "2025-12-19", name: "חנוכה ה׳" },
  { date: "2025-12-20", name: "חנוכה ו׳" },
  { date: "2025-12-21", name: "חנוכה ז׳" },
  { date: "2025-12-22", name: "חנוכה ח׳" },
  // פורים
  { date: "2026-03-05", name: "פורים" },
  { date: "2026-03-06", name: "שושן פורים" },
  // פסח
  { date: "2026-04-02", name: "פסח א׳" },
  { date: "2026-04-03", name: "פסח ב׳" },
  { date: "2026-04-04", name: "חול המועד פסח" },
  { date: "2026-04-05", name: "חול המועד פסח" },
  { date: "2026-04-06", name: "חול המועד פסח" },
  { date: "2026-04-07", name: "חול המועד פסח" },
  { date: "2026-04-08", name: "שביעי של פסח" },
  // ל״ג בעומר
  { date: "2026-05-12", name: "ל״ג בעומר" },
  // שבועות
  { date: "2026-05-22", name: "שבועות" },
  // י״ז בתמוז
  { date: "2026-07-02", name: "י״ז בתמוז" },
  // ט׳ באב
  { date: "2026-07-23", name: "ט׳ באב" },

  // ========== תשפ"ז (2026-2027) ==========
  // ראש השנה
  { date: "2026-09-12", name: "ראש השנה א׳" },
  { date: "2026-09-13", name: "ראש השנה ב׳" },
  // צום גדליה
  { date: "2026-09-14", name: "צום גדליה" },
  // יום כיפור
  { date: "2026-09-21", name: "יום כיפור" },
  // סוכות
  { date: "2026-09-26", name: "סוכות א׳" },
  { date: "2026-09-27", name: "סוכות ב׳" },
  { date: "2026-09-28", name: "חול המועד סוכות" },
  { date: "2026-09-29", name: "חול המועד סוכות" },
  { date: "2026-09-30", name: "חול המועד סוכות" },
  { date: "2026-10-01", name: "חול המועד סוכות" },
  { date: "2026-10-02", name: "הושענא רבה" },
  { date: "2026-10-03", name: "שמיני עצרת" },
  // חנוכה
  { date: "2026-12-04", name: "חנוכה א׳" },
  { date: "2026-12-05", name: "חנוכה ב׳" },
  { date: "2026-12-06", name: "חנוכה ג׳" },
  { date: "2026-12-07", name: "חנוכה ד׳" },
  { date: "2026-12-08", name: "חנוכה ה׳" },
  { date: "2026-12-09", name: "חנוכה ו׳" },
  { date: "2026-12-10", name: "חנוכה ז׳" },
  { date: "2026-12-11", name: "חנוכה ח׳" },
  // פורים
  { date: "2027-02-23", name: "פורים" },
  { date: "2027-02-24", name: "שושן פורים" },
  // פסח
  { date: "2027-03-23", name: "פסח א׳" },
  { date: "2027-03-24", name: "פסח ב׳" },
  { date: "2027-03-25", name: "חול המועד פסח" },
  { date: "2027-03-26", name: "חול המועד פסח" },
  { date: "2027-03-27", name: "חול המועד פסח" },
  { date: "2027-03-28", name: "חול המועד פסח" },
  { date: "2027-03-29", name: "שביעי של פסח" },
  // ל״ג בעומר
  { date: "2027-05-02", name: "ל״ג בעומר" },
  // שבועות
  { date: "2027-05-12", name: "שבועות" },
  // י״ז בתמוז
  { date: "2027-06-22", name: "י״ז בתמוז" },
  // ט׳ באב
  { date: "2027-07-13", name: "ט׳ באב" },

  // ========== תשפ"ח (2027-2028) ==========
  { date: "2027-10-02", name: "ראש השנה א׳" },
  { date: "2027-10-03", name: "ראש השנה ב׳" },
  { date: "2027-10-04", name: "צום גדליה" },
  { date: "2027-10-11", name: "יום כיפור" },
  { date: "2027-10-16", name: "סוכות א׳" },
  { date: "2027-10-17", name: "סוכות ב׳" },
  { date: "2027-10-18", name: "חול המועד סוכות" },
  { date: "2027-10-19", name: "חול המועד סוכות" },
  { date: "2027-10-20", name: "חול המועד סוכות" },
  { date: "2027-10-21", name: "חול המועד סוכות" },
  { date: "2027-10-22", name: "הושענא רבה" },
  { date: "2027-10-23", name: "שמיני עצרת" },
  { date: "2027-12-24", name: "חנוכה א׳" },
  { date: "2027-12-25", name: "חנוכה ב׳" },
  { date: "2027-12-26", name: "חנוכה ג׳" },
  { date: "2027-12-27", name: "חנוכה ד׳" },
  { date: "2027-12-28", name: "חנוכה ה׳" },
  { date: "2027-12-29", name: "חנוכה ו׳" },
  { date: "2027-12-30", name: "חנוכה ז׳" },
  { date: "2027-12-31", name: "חנוכה ח׳" },
  { date: "2028-03-14", name: "פורים" },
  { date: "2028-03-15", name: "שושן פורים" },
  { date: "2028-04-11", name: "פסח א׳" },
  { date: "2028-04-12", name: "פסח ב׳" },
  { date: "2028-04-13", name: "חול המועד פסח" },
  { date: "2028-04-14", name: "חול המועד פסח" },
  { date: "2028-04-15", name: "חול המועד פסח" },
  { date: "2028-04-16", name: "חול המועד פסח" },
  { date: "2028-04-17", name: "שביעי של פסח" },
  { date: "2028-05-21", name: "ל״ג בעומר" },
  { date: "2028-05-31", name: "שבועות" },
  { date: "2028-07-11", name: "י״ז בתמוז" },
  { date: "2028-08-01", name: "ט׳ באב" },
];

// מיפוי מהיר: "YYYY-MM-DD" -> שם חג
const holidayMap = new Map<string, string>();
for (const h of HOLIDAYS) {
  holidayMap.set(h.date, h.name);
}

/**
 * מחזיר שם חג/צום עברי עבור תאריך לועזי, או null אם אין.
 */
export function getHebrewHoliday(date: Date): string | null {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return holidayMap.get(key) ?? null;
}

/**
 * פורמט תאריך עברי מ-Intl API.
 * מחזיר מחרוזת כמו "י״ג ניסן".
 */
export function formatHebrewCalendarDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * מחזיר רק את היום העברי באותיות (גימטריה) — למשל "כ״ה" ל-25.
 */
export function formatHebrewDayOnly(date: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", { day: "numeric" }).format(date);
  } catch {
    return String(date.getDate());
  }
}

/**
 * מחזיר רק את החודש העברי — למשל "ניסן".
 */
export function formatHebrewMonthOnly(date: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", { month: "long" }).format(date);
  } catch {
    return "";
  }
}

/**
 * פורמט תאריך עברי מלא — יום בשבוע + תאריך + שנה.
 * לדוגמה: "יום שלישי, י״ג ניסן תשפ״ו"
 */
export function formatHebrewDateFull(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    const day = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(d);
    const hebrew = new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
    return `יום ${day}, ${hebrew}`;
  } catch {
    return "";
  }
}

/**
 * פורמט תאריך עברי תמציתי עם שעה.
 * לדוגמה: "ג' ניסן · 20:00"
 */
export function formatHebrewDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    const hebrew = formatHebrewCalendarDate(d);
    const time = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${hebrew} · ${time}`;
  } catch {
    return "";
  }
}
