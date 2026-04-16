import Link from "next/link";
import { LessonSearch, type SearchOptions } from "@/components/LessonSearch";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { broadcastTypeMeta } from "@/lib/enums";
import { Clock, Calendar as CalIcon } from "lucide-react";

export const metadata = {
  title: "שיעורים | TORA LIVE",
  description: "חפש ומצא שיעורי תורה חיים ומוקלטים לפי רב, נושא, תאריך ושעה. אלפי שיעורים מעודכנים.",
};

type Lesson = {
  id: string;
  title: string;
  description: string;
  rabbiSlug: string;
  rabbiName: string;
  category: string;
  topicValue: string;
  scheduledAt: Date;
  durationMin: number;
  tags: string[];
  isLive?: boolean;
  broadcastType: string;
};

const options: SearchOptions = {
  rabbis: [
    { value: "yosef-cohen", label: "הרב יוסף כהן", count: 312 },
    { value: "david-levi", label: "הרב דוד לוי", count: 198 },
    { value: "moshe-friedman", label: "הרב משה פרידמן", count: 520 },
    { value: "eliyahu-mizrahi", label: "הרב אליהו מזרחי", count: 240 },
    { value: "shlomo-aviner", label: "הרב שלמה אבינר", count: 410 },
  ],
  topics: [
    { value: "daf-yomi", label: "דף יומי" },
    { value: "halacha", label: "הלכה" },
    { value: "parsha", label: "פרשת שבוע" },
    { value: "mussar", label: "מוסר" },
    { value: "tanya", label: "תניא / חסידות" },
    { value: "machshava", label: "מחשבת ישראל" },
  ],
  tags: [
    { value: "beginners", label: "למתחילים" },
    { value: "women", label: "לנשים" },
    { value: "short", label: "שיעורים קצרים" },
  ],
};

function buildLessons(): Lesson[] {
  const now = Date.now();
  const h = 3600 * 1000;
  const d = 24 * h;
  const mk = (offset: number, hour: number) => {
    const dt = new Date(now + offset);
    dt.setHours(hour, 0, 0, 0);
    return dt;
  };
  const lessons: Omit<Lesson, "broadcastType">[] = [
    {
      id: "l1", title: "בבא מציעא דף ל״ב — השבת אבידה", description: "ניתוח הסוגיה בעקבות שיטות הראשונים עם דגש על השלכות מעשיות.",
      rabbiSlug: "yosef-cohen", rabbiName: "הרב יוסף כהן", category: "דף יומי", topicValue: "daf-yomi",
      scheduledAt: new Date(now + 30 * 60 * 1000), durationMin: 60, tags: ["beginners"], isLive: true,
    },
    {
      id: "l2", title: "תניא — פרק ל״ב, אהבת ישראל", description: "המשך הסדרה השבועית בתניא, יסודות אהבת ישראל לפי בעל התניא.",
      rabbiSlug: "david-levi", rabbiName: "הרב דוד לוי", category: "תניא / חסידות", topicValue: "tanya",
      scheduledAt: mk(1 * d, 20), durationMin: 45, tags: ["beginners"],
    },
    {
      id: "l3", title: "הלכות בורר בשבת — חלק א׳", description: "מבוא למלאכת בורר, שלושת התנאים, ודוגמאות מהמטבח השבועי.",
      rabbiSlug: "moshe-friedman", rabbiName: "הרב משה פרידמן", category: "הלכה", topicValue: "halacha",
      scheduledAt: mk(2 * d, 9), durationMin: 20, tags: ["short"],
    },
    {
      id: "l4", title: "פרשת ויקרא — קרבן יחיד וציבור", description: "עיון בפרשת השבוע ובמשמעות הקרבנות בימינו.",
      rabbiSlug: "yosef-cohen", rabbiName: "הרב יוסף כהן", category: "פרשת שבוע", topicValue: "parsha",
      scheduledAt: mk(4 * d, 18), durationMin: 50, tags: [],
    },
    {
      id: "l5", title: "מוסר — שער הבחינה של חובות הלבבות", description: "לימוד עיוני בספר חובות הלבבות עם דוגמאות מהחיים.",
      rabbiSlug: "shlomo-aviner", rabbiName: "הרב שלמה אבינר", category: "מוסר", topicValue: "mussar",
      scheduledAt: mk(-2 * d, 21), durationMin: 55, tags: [],
    },
    {
      id: "l6", title: "שיעור לנשים — הלכות כשרות המטבח", description: "סקירה מעשית של הלכות כשרות שימושיות בבית היהודי.",
      rabbiSlug: "moshe-friedman", rabbiName: "הרב משה פרידמן", category: "הלכה", topicValue: "halacha",
      scheduledAt: mk(1 * d, 11), durationMin: 40, tags: ["women"],
    },
    {
      id: "l7", title: "פרשת השבוע — עיון ביסודות", description: "שיעור שבועי בפרשה עם התבוננות בדברי חז״ל.",
      rabbiSlug: "david-levi", rabbiName: "הרב דוד לוי", category: "פרשת שבוע", topicValue: "parsha",
      scheduledAt: new Date(now + 45 * 60 * 1000), durationMin: 45, tags: [], isLive: true,
    },
    {
      id: "l8", title: "מחשבת ישראל — אמונה בדור שלנו", description: "שאלות יסוד באמונה ובדרכי ההתמודדות של צעירים כיום.",
      rabbiSlug: "shlomo-aviner", rabbiName: "הרב שלמה אבינר", category: "מחשבת ישראל", topicValue: "machshava",
      scheduledAt: mk(3 * d, 22), durationMin: 65, tags: [],
    },
    {
      id: "l9", title: "דף יומי — שבת דף קי״ט", description: "לימוד הדף היומי עם סיכום ומבוא לסוגיות המרכזיות.",
      rabbiSlug: "yosef-cohen", rabbiName: "הרב יוסף כהן", category: "דף יומי", topicValue: "daf-yomi",
      scheduledAt: mk(0, 7), durationMin: 50, tags: ["short"],
    },
    {
      id: "l10", title: "הלכה יומית — דיני נטילת ידיים", description: "סקירה קצרה של הלכות נטילת ידיים לסעודה.",
      rabbiSlug: "moshe-friedman", rabbiName: "הרב משה פרידמן", category: "הלכה", topicValue: "halacha",
      scheduledAt: mk(-1 * d, 14), durationMin: 15, tags: ["short", "beginners"],
    },
    {
      id: "l11", title: "חסידות — דברי תורה משולחן הצדיקים", description: "סיפורי צדיקים ותובנות מתורת החסידות.",
      rabbiSlug: "david-levi", rabbiName: "הרב דוד לוי", category: "תניא / חסידות", topicValue: "tanya",
      scheduledAt: mk(5 * d, 19), durationMin: 60, tags: [],
    },
    {
      id: "l12", title: "מוסר בוקר — עבודת המידות", description: "שיחת בוקר קצרה על עבודת המידות והתיקון היומי.",
      rabbiSlug: "shlomo-aviner", rabbiName: "הרב שלמה אבינר", category: "מוסר", topicValue: "mussar",
      scheduledAt: mk(1 * d, 7), durationMin: 15, tags: ["short"],
    },
  ];
  // הקצאת broadcastType מגוונת ל-mock כדי להדגים את הסינון.
  const typeCycle = [
    "LESSON",
    "PRAYER",
    "SELICHOT",
    "TEHILLIM",
    "HESPED",
    "WEDDING",
    "BAR_MITZVAH",
    "NIGGUN",
    "CHAZANUT",
    "EVENT",
    "KOL_NIDREI",
    "SHIUR_KLALI",
  ];
  return lessons.map((l, i) => ({
    ...l,
    broadcastType: typeCycle[i % typeCycle.length],
  }));
}

const fmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function isToday(d: Date) {
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
function isTomorrow(d: Date) {
  const n = new Date(); n.setDate(n.getDate() + 1);
  return d.toDateString() === n.toDateString();
}
function inDays(d: Date, days: number) {
  const diff = d.getTime() - Date.now();
  return diff >= 0 && diff <= days * 86400 * 1000;
}

function filterLessons(all: Lesson[], sp: {
  q?: string; rabbi?: string; topic?: string; date?: string; time?: string; tag?: string; type?: string;
}) {
  return all.filter((l) => {
    if (sp.q) {
      const text = `${l.title} ${l.description}`.toLowerCase();
      if (!text.includes(sp.q.toLowerCase())) return false;
    }
    if (sp.rabbi && l.rabbiSlug !== sp.rabbi) return false;
    if (sp.topic && l.topicValue !== sp.topic) return false;
    if (sp.type && l.broadcastType !== sp.type) return false;
    if (sp.tag && !l.tags.includes(sp.tag)) return false;
    if (sp.date) {
      if (sp.date === "today" && !isToday(l.scheduledAt)) return false;
      if (sp.date === "tomorrow" && !isTomorrow(l.scheduledAt)) return false;
      if (sp.date === "week" && !inDays(l.scheduledAt, 7)) return false;
      if (sp.date === "month" && !inDays(l.scheduledAt, 30)) return false;
    }
    if (sp.time) {
      const h = l.scheduledAt.getHours();
      if (sp.time === "morning" && !(h >= 6 && h < 12)) return false;
      if (sp.time === "noon" && !(h >= 12 && h < 16)) return false;
      if (sp.time === "evening" && !(h >= 16 && h < 20)) return false;
      if (sp.time === "night" && !(h >= 20 || h < 6)) return false;
    }
    return true;
  });
}

export default function LessonsPage({
  searchParams,
}: {
  searchParams: { q?: string; rabbi?: string; topic?: string; date?: string; time?: string; tag?: string; type?: string; sort?: string };
}) {
  const all = buildLessons();
  const filtered = filterLessons(all, searchParams);
  const sort = searchParams.sort ?? "upcoming";
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return b.scheduledAt.getTime() - a.scheduledAt.getTime();
    return a.scheduledAt.getTime() - b.scheduledAt.getTime();
  });
  const hasAnyFilter = !!(searchParams.q || searchParams.rabbi || searchParams.topic || searchParams.date || searchParams.time || searchParams.tag || searchParams.type);
  const activeTypeMeta = searchParams.type ? broadcastTypeMeta(searchParams.type) : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <header className="text-center mb-8">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">
          {activeTypeMeta && activeTypeMeta.value !== "LESSON" ? (
            <>
              <span className="text-primary">{activeTypeMeta.label}</span>
            </>
          ) : (
            <>
              שיעורי <span className="text-primary">תורה</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-lg text-ink-soft max-w-2xl mx-auto">
          {activeTypeMeta && activeTypeMeta.value !== "LESSON"
            ? activeTypeMeta.description
            : "חפש שיעור לפי רב, נושא, תאריך ושעה. אלפי שיעורים חיים ומוקלטים."}
        </p>
      </header>

      <div className="max-w-3xl mx-auto mb-8">
        <LessonSearch options={options} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="text-sm text-ink-muted">
          {sorted.length} תוצאות
          {hasAnyFilter && (
            <Link href="/lessons" className="mr-3 text-primary hover:underline">
              נקה סינון
            </Link>
          )}
        </div>
        <form method="GET" className="flex items-center gap-2">
          {Object.entries(searchParams).map(([k, v]) =>
            k === "sort" || !v ? null : <input key={k} type="hidden" name={k} value={v} />
          )}
          <label htmlFor="sort" className="text-xs text-ink-muted">מיון:</label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="h-9 px-3 rounded-btn border border-border bg-white text-sm text-ink focus:outline-none focus:border-primary"
          >
            <option value="upcoming">הקרוב ביותר</option>
            <option value="newest">חדש ביותר</option>
          </select>
          <button type="submit" className="h-9 px-3 rounded-btn bg-paper-soft border border-border text-sm hover:bg-white">
            החל
          </button>
        </form>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-card bg-paper-soft">
          <p className="text-lg text-ink">לא נמצאו שיעורים התואמים את הסינון.</p>
          <Link
            href="/lessons"
            className="mt-4 inline-flex h-10 px-5 items-center rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
          >
            נקה סינון
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((l) => (
            <LessonResultCard key={l.id} lesson={l} />
          ))}
        </div>
      )}
    </main>
  );
}

function LessonResultCard({ lesson }: { lesson: Lesson }) {
  return (
    <article className="card group flex flex-col p-5 transition hover:border-primary/40 hover:shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="pill">{lesson.category}</span>
          <BroadcastTypeBadge value={lesson.broadcastType} />
        </div>
        {lesson.isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-live/10 text-live px-2.5 py-1 text-xs font-semibold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-live" />
            משדר עכשיו
          </span>
        )}
      </div>
      <h3 className="hebrew-serif text-lg font-bold leading-snug text-ink group-hover:text-primary">
        {lesson.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-ink-muted flex-1">{lesson.description}</p>
      <div className="mt-3 text-sm text-ink-soft">{lesson.rabbiName}</div>
      <div className="mt-2 flex items-center gap-3 text-xs text-ink-subtle">
        <span className="flex items-center gap-1">
          <CalIcon className="w-3.5 h-3.5" />
          {fmt.format(lesson.scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {lesson.durationMin} דק׳
        </span>
      </div>
      {lesson.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lesson.tags.map((t) => (
            <span key={t} className="pill">#{t}</span>
          ))}
        </div>
      )}
      <Link
        href={`/lesson/${lesson.id}`}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={`מעבר לשיעור ${lesson.title}`}
      >
        לשיעור
      </Link>
    </article>
  );
}
