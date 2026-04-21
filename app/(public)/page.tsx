import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SponsorBanner, type SponsorInfo } from "@/components/SponsorBanner";
import { HomeHero, type HeroLesson } from "@/components/HomeHero";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

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

  // === Recommended lesson — אם אין live ואין next קרוב, ניקח שיעור מומלץ של היום
  let recommendedLesson: HeroLesson | null = null;
  if (liveLessons.length === 0 && !nextLive) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59);
    const rec = await db.lesson.findFirst({
      where: {
        isPublic: true, approvalStatus: "APPROVED", isSuspended: false,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        OR: [{ rabbi: { status: "APPROVED", isBlocked: false } }, { rabbiId: null }],
      },
      include: { rabbi: { select: { name: true, slug: true } }, category: true },
      orderBy: { viewCount: "desc" },
    });
    if (rec) {
      recommendedLesson = {
        id: rec.id, title: rec.title, description: rec.description ?? undefined,
        rabbiName: rec.rabbi?.name ?? rec.organizerName ?? "—",
        rabbiSlug: rec.rabbi?.slug ?? "",
        scheduledAt: rec.scheduledAt.toISOString(),
        durationMin: rec.durationMin,
        posterUrl: rec.posterUrl,
        category: rec.category?.name,
      };
    }
  }

  // Hero lessons (live takes priority)
  const heroLive: HeroLesson | null = liveLessons[0] ? {
    id: liveLessons[0].id,
    title: liveLessons[0].title,
    description: liveLessons[0].description ?? undefined,
    rabbiName: liveLessons[0].rabbi?.name ?? (liveLessons[0] as any).organizerName ?? "—",
    rabbiSlug: liveLessons[0].rabbi?.slug ?? "",
    scheduledAt: liveLessons[0].scheduledAt.toISOString(),
    durationMin: liveLessons[0].durationMin,
    posterUrl: liveLessons[0].posterUrl,
    embedUrl: liveLessons[0].liveEmbedUrl,
    liveStartedAt: liveLessons[0].updatedAt.toISOString(),
    viewerCount: liveLessons[0].viewCount,
  } : null;

  const heroNext: HeroLesson | null = nextLive ? {
    id: nextLive.id,
    title: nextLive.title,
    rabbiName: nextLive.rabbiName,
    rabbiSlug: nextLive.rabbiSlug,
    scheduledAt: nextLive.scheduledAt,
    posterUrl: nextLive.posterUrl,
  } : null;

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
    heroLive,
    heroNext,
    recommendedLesson,
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
  const { sponsor, live, nextLive, heroLive, heroNext, recommendedLesson, options, stats, calendarLessons } = await getHomeData();

  return (
    <>
      {/* 1. שיעור מוקדש (sponsor banner) */}
      <SponsorBanner sponsor={sponsor} />

      {/* 2. Hero — שידור חי / השיעור הקרוב / מומלץ */}
      <HomeHero liveLesson={heroLive} nextLesson={heroNext} recommendedLesson={recommendedLesson} />

      {/* 3. חיפוש שיעור — מתחת ל-hero, חופף בעדינות */}
      <section className="max-w-3xl mx-auto px-4 -mt-7 relative z-10 mb-12">
        <SearchAutocomplete />
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted flex-wrap">
          <span>חיפושים פופולריים:</span>
          {[
            { label: "דף יומי", slug: "daf-yomi" },
            { label: "פרשת שבוע", slug: "parsha" },
            { label: "הלכה", slug: "halacha" },
            { label: "מוסר", slug: "mussar" },
          ].map((tag, i) => (
            <span key={tag.slug} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">·</span>}
              <Link href={`/topic/${tag.slug}`} className="hover:text-primary transition">
                {tag.label}
              </Link>
            </span>
          ))}
        </div>
      </section>

      {/* 4. שיעורים בשידור חי כעת (חוץ מההירו) — שאר השידורים החיים */}
      {live.length > 1 && <LiveNowStrip lessons={live.slice(1)} />}

      {/* 5. לוח שיעורים שבועיים — 14 יום קדימה */}
      <WeeklyCalendar lessons={calendarLessons} title="לוח שיעורים — שבועיים קדימה" />

      {/* 6. דשבורד — סטטיסטיקות */}
      <LessonsCounter
        totalLessons={stats.totalLessons}
        totalHours={stats.totalHours}
        totalRabbis={stats.totalRabbis}
        totalViews={stats.totalViews}
      />
    </>
  );
}
