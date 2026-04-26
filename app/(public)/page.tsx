import Link from "next/link";
import { SponsorBanner, type SponsorInfo } from "@/components/SponsorBanner";
import { LiveBroadcastsSection, type LiveBroadcast, type NextBroadcast } from "@/components/LiveBroadcastsSection";
import { LessonsCounter } from "@/components/LessonsCounter";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { PopularLessonsStrip } from "@/components/PopularLessonsStrip";
import { TestimonialsStrip } from "@/components/TestimonialsStrip";
import { LANGUAGES, BROADCAST_TYPES } from "@/lib/enums";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  // המרת liveLessons לפורמט LiveBroadcast
  const live = liveLessons.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "אירוע",
    rabbiSlug: l.rabbi?.slug ?? "",
    viewerCount: l.viewCount,
    embedUrl: l.liveEmbedUrl,
    externalUrl: l.youtubeUrl ?? l.otherUrl,
    liveStartedAt: l.updatedAt.toISOString(),
    broadcastType: l.broadcastType,
    language: l.language,
  }));

  // לוח שנה — 30 יום קדימה (היה 14, הורחב כדי שלא יסתירו אישורים מאוחרים)
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 30 * 86400000);
  const dbCalendarLessons = await db.lesson.findMany({
    where: {
      scheduledAt: { gte: now, lte: monthAhead },
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
    take: 150,
  });

  const calendarLessons = dbCalendarLessons.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "אירוע",
    rabbiSlug: l.rabbi?.slug ?? "",
    scheduledAt: l.scheduledAt.toISOString(),
    durationMin: l.durationMin ?? undefined,
    category: l.category?.name,
    language: l.language,
    broadcastType: l.broadcastType,
    isLive: l.isLive,
  }));

  // שיעורים פופולריים — top 8 past lessons לפי viewCount (30 יום אחרונים)
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const popularLessons = await db.lesson.findMany({
    where: {
      approvalStatus: "APPROVED",
      isPublic: true,
      isSuspended: false,
      scheduledAt: { gte: monthAgo, lte: now },
      viewCount: { gt: 0 },
      OR: [
        { rabbi: { status: "APPROVED", isBlocked: false } },
        { rabbiId: null },
      ],
    },
    include: {
      rabbi: { select: { name: true, slug: true } },
      category: { select: { name: true } },
    },
    orderBy: { viewCount: "desc" },
    take: 8,
  }).then((rows) => rows.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "—",
    rabbiSlug: l.rabbi?.slug ?? "",
    viewCount: l.viewCount,
    posterUrl: l.posterUrl,
    category: l.category?.name ?? null,
    scheduledAt: l.scheduledAt.toISOString(),
    durationMin: l.durationMin ?? null,
  })));

  // טרנדינג — טופ 6 קטגוריות לפי מספר שיעורים בחודש הקרוב
  const trendingCategories = await db.lesson.groupBy({
    by: ["categoryId"],
    where: {
      scheduledAt: { gte: now, lte: monthAhead },
      approvalStatus: "APPROVED",
      isPublic: true,
      isSuspended: false,
      categoryId: { not: null },
    },
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: 6,
  });
  const trendingCategoryIds = trendingCategories.map((t) => t.categoryId).filter(Boolean) as string[];
  const categoryNames = trendingCategoryIds.length > 0
    ? await db.category.findMany({ where: { id: { in: trendingCategoryIds } }, select: { id: true, name: true } })
    : [];
  const trendingTopics = trendingCategories.map((t) => {
    const cat = categoryNames.find((c) => c.id === t.categoryId);
    return { name: cat?.name ?? "—", count: t._count.categoryId };
  }).filter((t) => t.name !== "—");

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
    calendarLessons,
    popularLessons,
    trendingTopics,
    stats: {
      totalLessons,
      totalHours: Math.round((sumDuration._sum.durationMin ?? 0) / 60),
      totalRabbis,
      totalViews: sumViews._sum.viewCount ?? 0,
    },
  };
}

export default async function HomePage() {
  const { sponsor, live, nextLive, stats, calendarLessons, popularLessons, trendingTopics } = await getHomeData();

  // המר את live ל-LiveBroadcast format
  const liveBroadcasts: LiveBroadcast[] = live.map((l) => ({
    id: l.id,
    title: l.title,
    rabbiName: l.rabbiName,
    rabbiSlug: l.rabbiSlug,
    embedUrl: l.embedUrl,
    externalUrl: l.externalUrl,
    posterUrl: null, // לא צריך — embed מספיק
    liveStartedAt: l.liveStartedAt,
    viewerCount: l.viewerCount,
  }));

  const nextBroadcast: NextBroadcast | null = nextLive ? {
    id: nextLive.id,
    title: nextLive.title,
    rabbiName: nextLive.rabbiName,
    rabbiSlug: nextLive.rabbiSlug,
    scheduledAt: nextLive.scheduledAt,
    posterUrl: nextLive.posterUrl,
  } : null;

  return (
    <>
      {/* 1. שיעור מוקדש */}
      <SponsorBanner sponsor={sponsor} />

      {/* === SECTION 1: שידורים חיים (רקע כהה) === */}
      <div id="live">
        <LiveBroadcastsSection broadcasts={liveBroadcasts} nextBroadcast={nextBroadcast} />
      </div>

      {/* Divider 1→2 — wave מלבן לנייר חם */}
      <div className="relative -mt-1 leading-none" aria-hidden="true">
        <svg viewBox="0 0 1440 60" className="w-full block text-amber-50" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,30 C180,60 360,0 720,25 C1080,50 1260,10 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>

      {/* === SECTION 2: לוח שיעורים (רקע נייר) === */}
      <div id="calendar" className="-mt-1">
        <WeeklyCalendar lessons={calendarLessons} title="לוח שיעורים" />
      </div>

      {/* Divider 2→Popular — wave עדין */}
      <div className="relative -mt-1 leading-none" aria-hidden="true">
        <svg viewBox="0 0 1440 60" className="w-full block text-white" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,30 C180,60 360,0 720,25 C1080,50 1260,10 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>

      {/* === SECTION 2.5: פופולריים + טרנדינג (אחרי הלוח) === */}
      <div id="popular" className="-mt-1">
        <PopularLessonsStrip lessons={popularLessons} topics={trendingTopics} />
      </div>

      {/* Divider Popular→3 — wave לכחול */}
      <div className="relative -mt-1 leading-none" aria-hidden="true">
        <svg viewBox="0 0 1440 80" className="w-full block text-primary" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,40 C240,10 480,60 720,40 C960,20 1200,70 1440,30 L1440,80 L0,80 Z" />
        </svg>
      </div>

      {/* === Testimonials strip (לפני הדשבורד) === */}
      <TestimonialsStrip />

      {/* === SECTION 3: דשבורד (רקע כחול) === */}
      <div id="dashboard" className="-mt-1">
        <LessonsCounter
          totalLessons={stats.totalLessons}
          totalHours={stats.totalHours}
          totalRabbis={stats.totalRabbis}
          totalViews={stats.totalViews}
        />
      </div>

      {/* Navigation dots — נקודות צדדיות למעבר מהיר (desktop only) */}
      <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3 pointer-events-none" aria-label="ניווט סקציות">
        <a href="#live" className="group pointer-events-auto" title="שידורים חיים">
          <span className="block w-3 h-3 rounded-full bg-live/40 border border-live ring-2 ring-transparent group-hover:ring-live/30 transition" />
        </a>
        <a href="#calendar" className="group pointer-events-auto" title="לוח שיעורים">
          <span className="block w-3 h-3 rounded-full bg-gold/40 border border-gold ring-2 ring-transparent group-hover:ring-gold/30 transition" />
        </a>
        <a href="#popular" className="group pointer-events-auto" title="פופולריים">
          <span className="block w-3 h-3 rounded-full bg-danger/40 border border-danger ring-2 ring-transparent group-hover:ring-danger/30 transition" />
        </a>
        <a href="#dashboard" className="group pointer-events-auto" title="דשבורד">
          <span className="block w-3 h-3 rounded-full bg-primary/40 border border-primary ring-2 ring-transparent group-hover:ring-primary/30 transition" />
        </a>
      </nav>
    </>
  );
}
