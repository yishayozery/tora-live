import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SponsorBanner, type SponsorInfo } from "@/components/SponsorBanner";

// dynamic — צריך session לחישוב canChat. revalidate לא יעבוד עם session.
export const dynamic = "force-dynamic";
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
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      OR: [
        { rabbi: { status: "APPROVED", isBlocked: false } },
        { rabbiId: null },  // אירועים ללא רב (כמו הכותל)
      ],
    },
    include: {
      rabbi: { select: { name: true, slug: true } },
      sources: { select: { id: true }, take: 1 },
    },
    take: 10,
  });

  // chat permissions — תלוי בסשן
  const session = await getServerSession(authOptions);
  let canChat = false;
  let isChatBlocked = false;
  if (session?.user?.id) {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (student) {
      if (student.isBlocked) isChatBlocked = true;
      else canChat = true;
    }
  }

  // השיעור החי הבא — להציג כשאין שיעור חי כרגע
  let nextLive: { id: string; title: string; rabbiName: string; rabbiSlug: string; scheduledAt: string; posterUrl: string | null } | null = null;
  if (liveLessons.length === 0) {
    const next = await db.lesson.findFirst({
      where: {
        isLive: false,
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
        scheduledAt: { gte: new Date() },
        // יש קישור לשידור (כדי שזה אכן יהיה שידור חי בעתיד)
        OR: [
          { liveEmbedUrl: { not: null } },
          { youtubeUrl: { not: null } },
          { otherUrl: { not: null } },
        ],
      },
      include: { rabbi: { select: { name: true, slug: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    if (next) {
      nextLive = {
        id: next.id,
        title: next.title,
        rabbiName: next.rabbi?.name ?? (next as any).organizerName ?? "—",
        rabbiSlug: next.rabbi?.slug ?? "",
        scheduledAt: next.scheduledAt.toISOString(),
        posterUrl: next.posterUrl,
      };
    }
  }

  const live: LiveLesson[] = liveLessons.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "אירוע",
    rabbiSlug: l.rabbi?.slug ?? "",
    viewerCount: l.viewCount,
    embedUrl: l.liveEmbedUrl,
    externalUrl: l.youtubeUrl ?? l.otherUrl,
    hasSources: l.sources.length > 0 || !!l.sourcesPdfUrl,
    sourcesPdfUrl: l.sourcesPdfUrl,
    canChat,
    isChatBlocked,
    // updatedAt משמש כ-proxy ל-liveStartedAt (כשהפכנו ל-isLive=true ה-updatedAt התעדכן)
    liveStartedAt: l.updatedAt.toISOString(),
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
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      OR: [
        { rabbi: { status: "APPROVED", isBlocked: false } },
        { rabbiId: null }, // אירועים ללא רב (הצעות משתמשים)
      ],
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
    rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "אירוע",
    rabbiSlug: l.rabbi?.slug ?? "",
    scheduledAt: l.scheduledAt.toISOString(),
    durationMin: l.durationMin ?? undefined,
    category: l.category?.name,
    broadcastType: l.broadcastType,
    isLive: l.isLive,
  }));

  // סטטיסטיקות אמיתיות מה-DB
  const [totalLessons, totalRabbis, sumViews, sumDuration] = await Promise.all([
    db.lesson.count({
      where: {
        approvalStatus: "APPROVED",
        isPublic: true,
        isSuspended: false,
      },
    }),
    db.rabbi.count({ where: { status: "APPROVED", isBlocked: false } }),
    db.lesson.aggregate({
      _sum: { viewCount: true },
      where: { approvalStatus: "APPROVED" },
    }),
    db.lesson.aggregate({
      _sum: { durationMin: true },
      where: { approvalStatus: "APPROVED" },
    }),
  ]);

  return {
    sponsor,
    live,
    nextLive,
    options,
    calendarLessons,
    stats: {
      totalLessons,
      totalHours: Math.round((sumDuration._sum.durationMin ?? 0) / 60),
      totalRabbis,
      totalViews: sumViews._sum.viewCount ?? 0,
    },
  };
}

export default async function HomePage() {
  const { sponsor, live, nextLive, options, stats, calendarLessons } = await getHomeData();

  return (
    <>
      <SponsorBanner sponsor={sponsor} />

      {/* Hero עם חיפוש */}
      <section className="relative max-w-6xl mx-auto px-4 pt-5 sm:pt-12 pb-6 sm:pb-8">
        <div className="text-center mb-5 sm:mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            הבית הדיגיטלי של רבני ישראל
          </span>
          <h1 className="hebrew-serif text-3xl sm:text-6xl font-bold text-ink leading-tight mt-3 sm:mt-4">
            מצא את השיעור המושלם<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-primary">לרגע הזה</span>
          </h1>
          <p className="mt-3 sm:mt-5 text-base sm:text-lg text-ink-soft max-w-2xl mx-auto px-2">
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

      <LiveNowStrip lessons={live} nextLive={nextLive} />

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
