import Link from "next/link";
import { SponsorBanner, type SponsorInfo } from "@/components/SponsorBanner";
import { LessonSearch, type SearchOptions } from "@/components/LessonSearch";
import { LiveNowStrip, type LiveLesson } from "@/components/LiveNowStrip";
import { PrayersEventsNow } from "@/components/PrayersEventsNow";
import { LessonsCounter } from "@/components/LessonsCounter";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LANGUAGES, BROADCAST_TYPES } from "@/lib/enums";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";

// TODO phase1: לחבר sponsor/options/stats ל-DB אמיתי. live + calendarLessons כבר מ-DB.
async function getHomeData() {
  const sponsor: SponsorInfo | null = {
    dedicationType: "LEZECHER",
    name: "הרב שלום קורח זצ״ל",
    donorName: "משפחת אלבז",
  };

  const liveLessons = await db.lesson.findMany({
    where: {
      isLive: true,
      rabbi: { status: "APPROVED", isBlocked: false },
    },
    include: { rabbi: { select: { name: true, slug: true } } },
    take: 10,
  });

  const live: LiveLesson[] = liveLessons.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi.name,
    rabbiSlug: l.rabbi.slug,
    viewerCount: l.viewCount,
  }));

  const options: SearchOptions = {
    rabbis: [
      { value: "yosef-cohen", label: "הרב יוסף כהן", count: 312 },
      { value: "david-levi", label: "הרב דוד לוי", count: 198 },
      { value: "moshe-friedman", label: "הרב משה פרידמן", count: 520 },
    ],
    topics: [
      { value: "daf-yomi", label: "דף יומי" },
      { value: "halacha", label: "הלכה" },
      { value: "parsha", label: "פרשת שבוע" },
      { value: "mussar", label: "מוסר" },
      { value: "tanya", label: "תניא / חסידות" },
      { value: "machshava", label: "מחשבת ישראל" },
    ],
    languages: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
    broadcastTypes: BROADCAST_TYPES.map((b) => ({ value: b.value, label: b.label })),
    tags: [
      { value: "beginners", label: "למתחילים" },
      { value: "women", label: "לנשים" },
      { value: "short", label: "שיעורים קצרים" },
    ],
  };

  // לוח שנה שבועי — מ-DB
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const dbCalendarLessons = await db.lesson.findMany({
    where: {
      scheduledAt: { gte: now, lte: weekAhead },
      rabbi: { status: "APPROVED", isBlocked: false },
    },
    include: {
      rabbi: { select: { name: true, slug: true } },
      category: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  });

  const calendarLessons = dbCalendarLessons.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi.name,
    rabbiSlug: l.rabbi.slug,
    scheduledAt: l.scheduledAt.toISOString(),
    durationMin: l.durationMin ?? undefined,
    category: l.category?.name,
    broadcastType: l.broadcastType,
    isLive: l.isLive,
  }));

  return {
    sponsor,
    live,
    options,
    calendarLessons,
    stats: {
      totalLessons: 47120,
      totalHours: 38940,
      totalRabbis: 182,
      totalViews: 2841000,
    },
  };
}

export default async function HomePage() {
  const { sponsor, live, options, stats, calendarLessons } = await getHomeData();

  return (
    <>
      <SponsorBanner sponsor={sponsor} />

      {/* Hero עם חיפוש */}
      <section className="relative max-w-6xl mx-auto px-4 pt-12 sm:pt-16 pb-8">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            הבית הדיגיטלי של רבני ישראל
          </span>
          <h1 className="hebrew-serif text-4xl sm:text-6xl font-bold text-ink leading-tight mt-4">
            מצא את השיעור המושלם <br />
            <span className="text-primary">לרגע הזה</span>
          </h1>
          <p className="mt-5 text-lg text-ink-soft max-w-2xl mx-auto">
            אלפי שיעורי תורה חיים ומוקלטים — לפי רב, נושא, תאריך ושעה. ללא הרשמה לצפייה.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <LessonSearch options={options} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-muted">
          <span>חיפושים פופולריים:</span>
          {["דף יומי", "פרשת שבוע", "הלכה יומית", "תניא"].map((tag) => (
            <Link
              key={tag}
              href={`/lessons?q=${encodeURIComponent(tag)}`}
              className="hover:text-primary transition"
            >
              {tag}
            </Link>
          )).reduce((acc: any[], el, i) => {
            if (i > 0) acc.push(<span key={`sep-${i}`} className="text-border">·</span>);
            acc.push(el);
            return acc;
          }, [])}
        </div>
      </section>

      <LiveNowStrip lessons={live} />

      <WeeklyCalendar lessons={calendarLessons} />

      <PrayersEventsNow />

      <LessonsCounter
        totalLessons={stats.totalLessons}
        totalHours={stats.totalHours}
        totalRabbis={stats.totalRabbis}
        totalViews={stats.totalViews}
      />
    </>
  );
}
