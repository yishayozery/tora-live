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

// רשימת סוגי השידור — מצומצמת ל-3 בלבד לפי דרישת הלקוח.
// הערכים נשמרים כמחרוזות ב-DB; אין לשנות את ה-value של רשומה קיימת.
export const BROADCAST_TYPES = [
  {
    value: "LESSON",
    label: "שיעור תורה",
    icon: "BookOpen",
    accent: "primary",
    description: "שיעור תורה — גמרא, הלכה, מחשבה, פרשת שבוע, דף יומי וכו'",
  },
  {
    value: "PRAYER",
    label: "תפילה",
    icon: "Heart",
    accent: "live",
    description: "תפילות, סליחות, תהילים, ועוד",
  },
  {
    value: "OTHER",
    label: "אחר",
    icon: "Sparkles",
    accent: "gold",
    description: "אירוע מיוחד, חופה, ניגונים, חזנות, הספד, וכו'",
  },
] as const satisfies readonly BroadcastTypeMeta[];

// תאימות לאחור — אם יש בDB ערך ישן (NIGGUN, HESPED וכו'), נציג אותו ככה
const LEGACY_TYPE_LABELS: Record<string, string> = {
  SELICHOT: "סליחות",
  TEHILLIM: "תהילים",
  HESPED: "הספד",
  WEDDING: "חופה / שבע ברכות",
  BAR_MITZVAH: "בר/בת מצוה",
  NIGGUN: "מפגש ניגונים",
  CHAZANUT: "חזנות",
  EVENT: "אירוע מיוחד",
  KOL_NIDREI: "לילי יום כיפור",
  SHIUR_KLALI: "שיעור כללי",
};

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
  if (!t) return broadcastTypeMeta(t).label;
  if (LEGACY_TYPE_LABELS[t]) return LEGACY_TYPE_LABELS[t];
  return broadcastTypeMeta(t).label;
}
