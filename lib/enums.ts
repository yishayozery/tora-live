// ערכי תצוגה לשדות enum-ים (מאוחסנים כ-String ב-SQLite).

export const LANGUAGES = [
  { value: "he", label: "עברית" },
  { value: "en", label: "אנגלית" },
  { value: "yi", label: "יידיש" },
  { value: "ladino", label: "לאדינו" },
  { value: "fr", label: "צרפתית" },
  { value: "es", label: "ספרדית" },
  { value: "ru", label: "רוסית" },
  { value: "other", label: "אחר" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["value"];

// צבעי אקצנט לסוגי השידור — תואמים לפלטה של Tailwind/הפרויקט.
export type BroadcastAccent =
  | "primary"
  | "gold"
  | "live"
  | "danger"
  | "purple"
  | "emerald";

export type BroadcastTypeMeta = {
  value: string;
  label: string;
  icon: string;
  accent: BroadcastAccent;
  description: string;
  examples?: string;
};

// רשימת סוגי השידור — משמשת לטפסים, סינון, badges ורצועת "תפילות ואירועים עכשיו".
// הערכים נשמרים כמחרוזות ב-DB; אין לשנות את ה-value של רשומה קיימת.
export const BROADCAST_TYPES = [
  {
    value: "LESSON",
    label: "שיעור",
    icon: "BookOpen",
    accent: "primary",
    description: "שיעור תורה רגיל — גמרא, הלכה, מחשבה",
    examples: "דף יומי, הלכה יומית, פרשת שבוע",
  },
  {
    value: "PRAYER",
    label: "תפילה",
    icon: "Heart",
    accent: "live",
    description: "תפילה יומית או מיוחדת",
    examples: "שחרית, מנחה, ערבית",
  },
  {
    value: "SELICHOT",
    label: "סליחות",
    icon: "Moon",
    accent: "purple",
    description: "אמירת סליחות בחבורה",
    examples: "אלול, עשרת ימי תשובה, תעניות",
  },
  {
    value: "TEHILLIM",
    label: "תהילים",
    icon: "Scroll",
    accent: "gold",
    description: "אמירת תהילים בציבור",
    examples: "לרפואה, לעת צרה, אמירה יומית",
  },
  {
    value: "HESPED",
    label: "הספד",
    icon: "Flame",
    accent: "danger",
    description: "הספד ומעמד פרידה",
    examples: "לוויה, שבעה, שלושים",
  },
  {
    value: "WEDDING",
    label: "חופה / שבע ברכות",
    icon: "HandHeart",
    accent: "gold",
    description: "חופה או שבע ברכות בשידור חי",
    examples: "חופה, שבע ברכות, ברכת חתנים",
  },
  {
    value: "BAR_MITZVAH",
    label: "בר/בת מצוה",
    icon: "Cake",
    accent: "primary",
    description: "שמחת בר או בת מצוה",
    examples: "דרשה, עלייה לתורה, סעודת מצוה",
  },
  {
    value: "NIGGUN",
    label: "מפגש ניגונים",
    icon: "Music",
    accent: "emerald",
    description: "מפגש שירה וניגונים",
    examples: "ניגוני חסידות, התעוררות, שירה בציבור",
  },
  {
    value: "CHAZANUT",
    label: "חזנות",
    icon: "Sparkles",
    accent: "gold",
    description: "חזנות ופיוט",
    examples: "נוסח תפילה, פיוטים, קונצרט חזנות",
  },
  {
    value: "EVENT",
    label: "אירוע מיוחד",
    icon: "Users",
    accent: "purple",
    description: "אירוע מיוחד או התכנסות",
    examples: "הילולא, הכנסת ספר תורה, יום השנה",
  },
  {
    value: "KOL_NIDREI",
    label: "לילי יום כיפור",
    icon: "Moon",
    accent: "primary",
    description: "כל נדרי ותפילות יום הכיפורים",
    examples: "כל נדרי, ערבית, נעילה",
  },
  {
    value: "SHIUR_KLALI",
    label: "שיעור כללי",
    icon: "Sunrise",
    accent: "emerald",
    description: "פורמט נפרד — ראשי ישיבה, שיעורי עומק",
    examples: "שיעור כללי ישיבתי, עיון ראשי ישיבה",
  },
] as const satisfies readonly BroadcastTypeMeta[];

export type BroadcastType = (typeof BROADCAST_TYPES)[number]["value"];

export const BROADCAST_TYPE_VALUES = BROADCAST_TYPES.map((b) => b.value) as [
  BroadcastType,
  ...BroadcastType[]
];

const DEFAULT_BROADCAST_META: BroadcastTypeMeta = BROADCAST_TYPES[0];

export function broadcastTypeMeta(
  value: string | null | undefined
): BroadcastTypeMeta {
  return (
    BROADCAST_TYPES.find((b) => b.value === value) ?? DEFAULT_BROADCAST_META
  );
}

export function languageLabel(code: string | null | undefined): string {
  return LANGUAGES.find((l) => l.value === code)?.label ?? "";
}

export function broadcastTypeLabel(t: string | null | undefined): string {
  return broadcastTypeMeta(t).label;
}
