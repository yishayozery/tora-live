import Link from "next/link";
import { SponsorBanner, type SponsorInfo } from "@/components/SponsorBanner";
import { DonationTicker, type DedicationEntry } from "@/components/DonationTicker";
import { LiveBroadcastsSection, type LiveBroadcast, type NextBroadcast } from "@/components/LiveBroadcastsSection";
import { LessonsCounter } from "@/components/LessonsCounter";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { PopularLessonsStrip } from "@/components/PopularLessonsStrip";
import { TestimonialsStrip } from "@/components/TestimonialsStrip";
import { LANGUAGES, BROADCAST_TYPES } from "@/lib/enums";
import { db } from "@/lib/db";
// ISR — מתרענן כל 30 שניות בצד השרת, אבל מוגש מהמטמון בין לבין.
// תחת עומס של 100 RPS זה ~3 רינדורים בדקה במקום 6000.
// LIVE NOW שמתחיל באמצע — יקח עד 30 שניות להופיע. סביר.
export const revalidate = 30;

async function getHomeData() {
  // --- תורם היום: רשומת Sponsor של היום (אם יש), אחרת התרומה הציבורית האחרונה ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let sponsor: SponsorInfo | null = null;
  try {
    const todaySponsor = await db.sponsor.findFirst({
      where: { date: { gte: todayStart, lt: todayEnd } },
      orderBy: { createdAt: "desc" },
    });
    if (todaySponsor) {
      sponsor = {
        dedicationType: (todaySponsor.dedicationType as "LEZECHER" | "LIZCHUT") ?? null,
        name: todaySponsor.name,
        donorName: todaySponsor.donorName,
      };
    } else {
      // fallback — תרומה ציבורית עם הקדשה (לפי הסדר ההפוך)
      const latest = await db.donation.findFirst({
        where: { showPublicly: true, dedicationName: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      if (latest && latest.dedicationName) {
        sponsor = {
          dedicationType: (latest.dedicationType as "LEZECHER" | "LIZCHUT") ?? null,
          name: latest.dedicationName,
          donorName: latest.donorName,
        };
      }
    }
  } catch {
    // אם הטבלאות לא קיימות בסביבת dev — לא מפילים את הדף
    sponsor = null;
  }

  // --- כל ההקדשות הציבוריות (ticker) ---
  let dedications: DedicationEntry[] = [];
  try {
    const rows = await db.donation.findMany({
      where: { showPublicly: true, dedicationName: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, dedicationName: true, dedicationType: true,
        donorName: true, amount: true, createdAt: true,
      },
    });
    dedications = rows.map((r) => ({
      id: r.id,
      type: r.dedicationType ?? "LIZCHUT",
      name: r.dedicationName!,
      donorName: r.donorName,
      amount: r.amount,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    dedications = [];
  }

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
      rabbi: { select: { name: true, slug: true, photoUrl: true } },
      sources: { select: { id: true }, take: 1 },
    },
    take: 10,
  });

  // השיעור החי הבא — להציג כשאין שיעור חי כרגע
  let nextLive: { id: string; title: string; rabbiName: string; rabbiSlug: string; rabbiPhotoUrl: string | null; scheduledAt: string; posterUrl: string | null } | null = null;
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
      include: { rabbi: { select: { name: true, slug: true, photoUrl: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    if (next) {
      nextLive = {
        id: next.id,
        title: next.title,
        rabbiName: next.rabbi?.name ?? (next as any).organizerName ?? "—",
        rabbiSlug: next.rabbi?.slug ?? "",
        rabbiPhotoUrl: next.rabbi?.photoUrl ?? null,
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
    rabbiPhotoUrl: l.rabbi?.photoUrl ?? null,
    viewerCount: l.viewCount,
    embedUrl: l.liveEmbedUrl,
    externalUrl: l.youtubeUrl ?? l.otherUrl,
    liveStartedAt: l.updatedAt.toISOString(),
    broadcastType: l.broadcastType,
    language: l.language,
  }));

  // לוח שנה — מתחילת היום (כדי לא לפספס שיעורים שהשעה שלהם זה עתה עברה) עד 30 יום קדימה
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const monthAhead = new Date(now.getTime() + 30 * 86400000);
  const dbCalendarLessons = await db.lesson.findMany({
    where: {
      scheduledAt: { gte: startOfToday, lte: monthAhead },
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      // אירועי הכנה לא צריכים להופיע ציבורית (כבר מסומנים isPublic:false אבל ליתר ביטחון)
      broadcastType: { not: "PREP" },
      OR: [
        { rabbi: { status: "APPROVED", isBlocked: false } },
        { rabbiId: null }, // אירועים ללא רב (הצעות משתמשים)
      ],
    },
    include: {
      rabbi: { select: { name: true, slug: true, photoUrl: true } },
      category: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 150,
  });

  // bookmarks נטענים בצד הלקוח דרך /api/bookmarks/me — לא חוסם ISR לדף הראשי.
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
    // bookmarked משלים בלקוח דרך useEffect ב-WeeklyCalendar
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
      rabbi: { select: { name: true, slug: true, photoUrl: true } },
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
    dedications,
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
  const { sponsor, dedications, live, nextLive, stats, calendarLessons, popularLessons, trendingTopics } = await getHomeData();

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
    rabbiPhotoUrl: (nextLive as any).rabbiPhotoUrl ?? null,
    scheduledAt: nextLive.scheduledAt,
    posterUrl: nextLive.posterUrl,
  } : null;

  return (
    <>
      {/* 1. שיעור מוקדש — תורם היום */}
      <SponsorBanner sponsor={sponsor} />

      {/* 1b. לוח הקדשות מתגלגל — דסקטופ: עמודה צד שמאל. מובייל: רצועה אופקית מעל השידורים */}
      <DonationTicker donations={dedications} />

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
