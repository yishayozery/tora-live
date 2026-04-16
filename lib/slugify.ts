// מייצר slug ידידותי ל-URL מתוך שם בעברית או אנגלית.
// אסטרטגיה: טבלת תעתיק עברי → לטיני. נופל חזרה על id אם אין אותיות מתאימות.

const HE_TO_LATIN: Record<string, string> = {
  א: "a", ב: "b", ג: "g", ד: "d", ה: "h",
  ו: "v", ז: "z", ח: "ch", ט: "t", י: "y",
  כ: "k", ך: "k", ל: "l", מ: "m", ם: "m",
  נ: "n", ן: "n", ס: "s", ע: "a", פ: "p",
  ף: "f", צ: "tz", ץ: "tz", ק: "k", ר: "r",
  ש: "sh", ת: "t",
  "'": "", '"': "", "״": "", "׳": "",
};

// מילות קישור/כבוד שלא נוסיף ל-slug ("הרב", "הגאון", וכו')
const STOP_WORDS = new Set([
  "הרב", "הרה", "רב", "הגאון", "הרה״ג", "רבי", "מרן", "הגר", "הגרה",
]);

export function slugify(input: string): string {
  if (!input) return "";
  // מפרק לניקוד (נסיר אח"כ)
  const withoutNiqqud = input.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "");

  // מפצל למילים ומסנן stop-words
  const words = withoutNiqqud
    .split(/[\s\-_]+/)
    .filter((w) => w && !STOP_WORDS.has(w));

  // תעתיק ותלנית
  const transliterated = words
    .map((word) =>
      word
        .split("")
        .map((ch) => {
          if (/[a-zA-Z0-9]/.test(ch)) return ch.toLowerCase();
          if (HE_TO_LATIN[ch] !== undefined) return HE_TO_LATIN[ch];
          return "";
        })
        .join("")
    )
    .filter(Boolean);

  const base = transliterated.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return base || "";
}

/**
 * מוודא slug ייחודי. אם ה-base תפוס, מוסיף סיומת מספרית.
 * @param isTaken פונקציה שמחזירה true אם ה-slug תפוס
 */
export async function uniqueSlug(
  base: string,
  isTaken: (s: string) => Promise<boolean>
): Promise<string> {
  let candidate = base || "rabbi";
  if (!(await isTaken(candidate))) return candidate;
  for (let i = 2; i < 1000; i++) {
    const next = `${base}-${i}`;
    if (!(await isTaken(next))) return next;
  }
  // fallback
  return `${base}-${Date.now().toString(36)}`;
}
