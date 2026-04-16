// Mock data for Phase 1 development before DB is connected.
// Replace with real Prisma queries once Supabase is provisioned.

export type MockRabbi = {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  photoUrl: string;
  totalHours: number;
  totalLessons: number;
  totalViews: number;
  categories: string[];
};

export type MockLesson = {
  id: string;
  rabbiSlug: string;
  rabbiName: string;
  title: string;
  description: string;
  category: string;
  scheduledAt: string;
  durationMin: number;
  youtubeUrl?: string;
  isLive?: boolean;
  viewCount: number;
  broadcastType?: string;
};

export const mockRabbis: MockRabbi[] = [
  {
    id: "r1",
    slug: "yosef-cohen",
    displayName: "הרב יוסף כהן",
    bio: "ראש ישיבת אור החיים, מוסר שיעורים יומיים בגמרא ובהלכה כבר למעלה משלושים שנה. מתמחה בסוגיות ממסכת בבא מציעא ובהלכות שבת.",
    photoUrl: "",
    totalHours: 1240,
    totalLessons: 312,
    totalViews: 45200,
    categories: ["דף יומי", "הלכה", "מוסר", "פרשת שבוע"],
  },
  {
    id: "r2",
    slug: "david-levi",
    displayName: "הרב דוד לוי",
    bio: "רב קהילת בית יעקב בירושלים. שיעוריו עוסקים במחשבת ישראל, חסידות וקבלה למתחילים.",
    photoUrl: "",
    totalHours: 680,
    totalLessons: 198,
    totalViews: 22800,
    categories: ["מחשבה", "חסידות", "תניא"],
  },
  {
    id: "r3",
    slug: "moshe-friedman",
    displayName: "הרב משה פרידמן",
    bio: "מרצה ומחבר ספרים בתחום ההלכה היומית. שיעורים קצרים ומרוכזים בני 15-20 דקות.",
    photoUrl: "",
    totalHours: 410,
    totalLessons: 520,
    totalViews: 67100,
    categories: ["הלכה יומית", "שאלות ותשובות"],
  },
];

const now = Date.now();
const day = 86400000;

export const mockLessons: MockLesson[] = [
  {
    id: "l1",
    rabbiSlug: "yosef-cohen",
    rabbiName: "הרב יוסף כהן",
    title: "בבא מציעא דף ל\"ב — השבת אבידה",
    description: "ניתוח הסוגיה בעקבות שיטות הראשונים, עם דגש על השלכות מעשיות.",
    category: "דף יומי",
    scheduledAt: new Date(now + 2 * 3600 * 1000).toISOString(),
    durationMin: 60,
    isLive: true,
    youtubeUrl: "https://youtube.com/live/example",
    viewCount: 142,
    broadcastType: "LESSON",
  },
  {
    id: "l2",
    rabbiSlug: "david-levi",
    rabbiName: "הרב דוד לוי",
    title: "תניא — פרק ל\"ב, אהבת ישראל",
    description: "המשך הסדרה השבועית בתניא. הפרק עוסק ביסודות אהבת ישראל לפי בעל התניא.",
    category: "תניא",
    scheduledAt: new Date(now + 1 * day).toISOString(),
    durationMin: 45,
    viewCount: 0,
    broadcastType: "SHIUR_KLALI",
  },
  {
    id: "l3",
    rabbiSlug: "moshe-friedman",
    rabbiName: "הרב משה פרידמן",
    title: "הלכות בורר בשבת — חלק א'",
    description: "מבוא למלאכת בורר, שלושת התנאים, ודוגמאות מהמטבח השבועי.",
    category: "הלכה יומית",
    scheduledAt: new Date(now + 2 * day).toISOString(),
    durationMin: 20,
    viewCount: 0,
  },
  {
    id: "l4",
    rabbiSlug: "yosef-cohen",
    rabbiName: "הרב יוסף כהן",
    title: "פרשת ויקרא — קרבן ויחיד וציבור",
    description: "עיון בפרשה השבועית ובמשמעות הקרבנות בימינו.",
    category: "פרשת שבוע",
    scheduledAt: new Date(now + 4 * day).toISOString(),
    durationMin: 50,
    viewCount: 0,
  },
];

export const siteStats = {
  totalHours: mockRabbis.reduce((s, r) => s + r.totalHours, 0),
  totalLessons: mockRabbis.reduce((s, r) => s + r.totalLessons, 0),
  totalViews: mockRabbis.reduce((s, r) => s + r.totalViews, 0),
  activeRabbis: mockRabbis.length,
  liveNow: mockLessons.filter((l) => l.isLive).length,
  thisWeek: mockLessons.length,
};
