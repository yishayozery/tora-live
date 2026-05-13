// קוד פתיחת שידור — זכיר, בעברית, קל להעברה ב-WhatsApp.
// פורמט: NNNN-מילה (למשל "7421-תורה"). 4 ספרות + מילה עברית קצרה.
// חלל מצב: ~10000 × 60 ≈ 600,000. עם rate-limit וחלון זמן של ±60 דק' סביב השיעור — מספיק.

const WORDS = [
  "תורה", "אורות", "אמונה", "חכמה", "בינה", "דעת", "צדיק", "ברכה",
  "שלום", "אהבה", "תפילה", "מצוה", "כתר", "פסוק", "משנה", "גמרא",
  "מדרש", "הלכה", "אגדה", "ספר", "פרק", "סוגיא", "ישיבה", "כולל",
  "תלמיד", "חבר", "רעות", "אחוה", "שמחה", "תיקון", "גאולה", "משיח",
  "ציון", "ירושלים", "שבת", "חג", "מועד", "ראש", "סדר", "מסכת",
  "אמת", "צדק", "חסד", "רחמים", "ענוה", "יראה", "תשובה", "אדם",
  "בית", "עולם", "ארץ", "שמים", "אור", "נר", "אש", "מים",
  "לב", "נפש", "רוח", "שיר", "קול", "דרך", "שער", "מעיין",
];

export function randomStreamCode(): string {
  const num = String(Math.floor(1000 + Math.random() * 9000)); // 4 ספרות, 1000-9999
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${num}-${word}`;
}

// השוואה — מקבל קוד מהמשתמש (גמיש לרווחים/מקפים) ומחזיר תקני
export function normalizeStreamCode(input: string): string {
  return input.trim().replace(/\s+/g, "").replace(/[־–—]/g, "-");
}

export function streamCodeMatches(stored: string, attempt: string): boolean {
  return normalizeStreamCode(stored) === normalizeStreamCode(attempt);
}

// חלון זמן: ±60 דק' סביב scheduledAt (קודם לכן הרב לא מתחיל; אחרי — השיעור עבר)
export function isWithinStreamWindow(scheduledAt: Date, durationMin: number | null | undefined): boolean {
  const now = Date.now();
  const start = scheduledAt.getTime() - 60 * 60_000;
  const end = scheduledAt.getTime() + (durationMin ?? 60) * 60_000 + 30 * 60_000;
  return now >= start && now <= end;
}
