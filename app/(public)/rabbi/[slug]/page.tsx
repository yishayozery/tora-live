import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const SITE = "https://tora-live.co.il";

// === SEO + Open Graph ===
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const rabbi = await db.rabbi.findUnique({
    where: { slug: params.slug },
    select: { name: true, bio: true, photoUrl: true, _count: { select: { lessons: true } } },
  });
  if (!rabbi) return { title: "רב לא נמצא | TANA" };

  const shortBio = (rabbi.bio ?? "").trim().slice(0, 80);
  const title = `הרב ${rabbi.name} — שיעורי תורה בשידור חי | TANA`.slice(0, 70);
  const description = `האזינו לשיעורים של הרב ${rabbi.name} — ${shortBio || "שיעורי תורה, פרשת שבוע, הלכה ועוד"}. חינם, ללא הרשמה.`.slice(0, 160);
  const url = `${SITE}/rabbi/${params.slug}`;
  const image = rabbi.photoUrl || `${SITE}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        he: url,
        en: `${SITE}/en/rabbi/${params.slug}`,
      },
    },
    openGraph: {
      title: `הרב ${rabbi.name} | TANA`,
      description,
      url,
      type: "profile",
      images: [{ url: image, alt: `הרב ${rabbi.name}` }],
      locale: "he_IL",
      siteName: "TANA",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { FollowButton } from "@/components/FollowButton";
import { ContactRabbiButton } from "@/components/ContactRabbiButton";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import {
  Calendar,
  Radio,
  FileText,
  Youtube,
  Music,
  Globe,
  Facebook,
  Link as LinkIcon,
  Eye,
  Archive,
  Search,
  Share2,
  Mail,
  Play,
  Star,
  Download,
} from "lucide-react";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { BROADCAST_TYPES } from "@/lib/enums";
import { LogoIcon } from "@/components/Logo";
import { ExpirationCountdown } from "@/components/ExpirationCountdown";
import { HeroBlock } from "@/components/rabbi-profile/HeroBlock";
import { MessagesSlideshow } from "@/components/rabbi-profile/MessagesSlideshow";
import { AboutCard } from "@/components/rabbi-profile/AboutCard";
import { WhatYouCanDo } from "@/components/rabbi-profile/WhatYouCanDo";
import { StickyFollowCTA } from "@/components/rabbi-profile/StickyFollowCTA";

const MEDIA_META: Record<string, { label: string; icon: typeof Youtube }> = {
  youtube: { label: "YouTube", icon: Youtube },
  spotify: { label: "Spotify", icon: Music },
  applePodcast: { label: "Apple Podcasts", icon: Music },
  soundcloud: { label: "SoundCloud", icon: Music },
  facebook: { label: "Facebook", icon: Facebook },
  website: { label: "אתר אישי", icon: Globe },
  other: { label: "קישור נוסף", icon: LinkIcon },
};

const PAGE_SIZE = 12;

// ISR — דף רב מתעדכן כל 5 דקות (תוכן יציב יחסית)
export const revalidate = 300;

export default async function RabbiPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { page?: string; q?: string; type?: string; year?: string };
}) {
  const now = new Date();
  const currentPage = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const filterQ = (searchParams?.q ?? "").trim().toLowerCase();
  const filterType = searchParams?.type ?? "";
  const filterYear = searchParams?.year ?? "";

  // אופטימיזציה: מוצא קודם את הרב (קליל). השיעורים נטענים בנפרד עם cap על המספר —
  // רב עם 5000 שיעורים לא יכריע את ה-RSC payload. הסטטיסטיקות נשלפות עם aggregate.
  const rabbi = await db.rabbi.findUnique({
    where: { slug: params.slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      _count: { select: { followers: true } },
      messages: {
        where: {
          published: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true },
        take: 30,
      },
    },
  });

  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) notFound();

  // שיעורים — בלי `include: { lessons }` השמן. עד 500 שיעורים — מספיק להצגה לכל מי שלא ארכיב עצום;
  // למקרה קצה של רב עם 5000+ שיעורים — לא תקרוס המערכת. הסטטיסטיקה האמיתית מקוונת ב-aggregate.
  const lessonsBase = {
    rabbiId: rabbi.id,
    isPublic: true,
    approvalStatus: "APPROVED",
    isSuspended: false,
  } as const;

  const [allLessons, lessonStats] = await Promise.all([
    db.lesson.findMany({
      where: lessonsBase,
      orderBy: { scheduledAt: "desc" },
      take: 500,
      include: {
        category: true,
        sources: { select: { id: true }, take: 1 },
      },
    }),
    // סטטיסטיקה אמיתית מעל **כל** השיעורים — לא רק ה-500 שהבאנו
    db.lesson.aggregate({
      where: lessonsBase,
      _count: true,
      _sum: { viewCount: true, durationMin: true },
    }),
  ]);

  // מצמידים את השיעורים ל-rabbi כדי לשמור על שאר הקוד כפי שהוא.
  // Cast ל-any כי הוספנו שדה דינמי שלא נמצא בטיפוס Prisma.
  (rabbi as any).lessons = allLessons;
  type LessonRow = typeof allLessons[number];

  // --- session / follow / contact ---
  const session = await getServerSession(authOptions);
  let canFollow = false;
  let isFollowing = false;
  let canContact = false;
  let isContactBlocked = false;
  let userInfo: { email?: string; phone?: string; name?: string } | undefined;
  if (session?.user?.id) {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true } } },
    });
    if (student) {
      userInfo = {
        name: student.name,
        email: student.user?.email,
        phone: student.phoneE164 ?? undefined,
      };
    }
    if (student) {
      if (student.isBlocked) {
        isContactBlocked = true;
      } else {
        canFollow = true;
        canContact = true;
        const f = await db.follow.findUnique({
          where: {
            studentId_rabbiId: { studentId: student.id, rabbiId: rabbi.id },
          },
        });
        isFollowing = !!f;
      }
    }
  }

  // --- media links ---
  let mediaLinks: Record<string, string> = {};
  try {
    if (rabbi.mediaLinks) mediaLinks = JSON.parse(rabbi.mediaLinks);
  } catch {}
  const mediaEntries = Object.entries(mediaLinks).filter(([, v]) => v);

  // --- split lessons ---
  // עתידי = scheduledAt עתידי AND לא שודר עדיין (אין streamId), או isLive כרגע
  const upcomingLessons: LessonRow[] = allLessons
    .filter((l) => l.isLive || (new Date(l.scheduledAt) >= now && !(l as any).streamId))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

  // ארכיון = שיעור שתאריך מתוכנן עבר, או שיעור ששודר בפועל (יש לו streamId ולא משדר כרגע).
  // הסיבה השנייה תופסת מקרים שבהם שיעור נפתח לשידור לפני הזמן שלו ועדיין "עתידי" לפי scheduledAt.
  const pastLessons: LessonRow[] = allLessons
    .filter((l) => new Date(l.scheduledAt) < now || ((l as any).streamId && !l.isLive))
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  // --- stats — מתוך aggregate (לא מוגבל ל-500 שהבאנו) ---
  const totalLessons = lessonStats._count;
  const totalViews = lessonStats._sum.viewCount ?? 0;
  const totalHours = (lessonStats._sum.durationMin ?? 0) / 60;

  // --- group past lessons by category ---
  const categoriesWithPast = rabbi.categories
    .map((cat) => ({
      ...cat,
      lessons: pastLessons.filter((l) => l.categoryId === cat.id),
    }))
    .filter((cat) => cat.lessons.length > 0);

  // --- "ספרייה" — שיעורים שהוקלטו ועדיין בתוקף (recording זמין להורדה/צפייה) ---
  const recordingsAvailable = pastLessons
    .filter((l: any) => l.recordingExpiry && new Date(l.recordingExpiry) > now && (l.recordingUrl || l.playbackUrl))
    .sort((a: any, b: any) => new Date(a.recordingExpiry).getTime() - new Date(b.recordingExpiry).getTime())
    .slice(0, 8); // נציג עד 8 בולטים

  const uncategorizedPast = pastLessons.filter((l) => !l.categoryId);

  // === Featured lesson — הכי נצפה ===
  const featuredLesson = [...pastLessons].sort((a, b) => b.viewCount - a.viewCount)[0] ?? null;

  // === Share URL ===
  const rabbiUrl = `${SITE}/rabbi/${rabbi.slug}`;
  const shareText = encodeURIComponent(`שיעורי תורה של ${rabbi.name} ב-TANA:\n${rabbiUrl}`);

  // === JSON-LD (Person + Teacher + ProfilePage) ===
  const personSchema: any = {
    "@context": "https://schema.org",
    "@type": ["Person", "Teacher"],
    name: `הרב ${rabbi.name}`,
    honorificPrefix: "הרב",
    jobTitle: "רב / מגיד שיעור",
    url: rabbiUrl,
    description: (rabbi.bio ?? "").slice(0, 500) || `שיעורי תורה מאת הרב ${rabbi.name}`,
    knowsAbout: ["תורה", "הלכה", "פרשת שבוע", "תלמוד", "מחשבת ישראל"],
    memberOf: {
      "@type": "Organization",
      name: "TANA",
      url: SITE,
    },
  };
  if (rabbi.photoUrl) personSchema.image = rabbi.photoUrl;
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: rabbiUrl,
    name: `הרב ${rabbi.name} — דף הרב ב-TANA`,
    inLanguage: "he-IL",
    mainEntity: personSchema,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
      />
      {/* ===== New Hero ===== */}
      <HeroBlock
        rabbi={{
          id: rabbi.id,
          name: rabbi.name,
          slug: rabbi.slug,
          photoUrl: rabbi.photoUrl ?? null,
          bio: rabbi.bio ?? null,
        }}
        stats={{
          lessons: totalLessons,
          hours: totalHours,
          followers: rabbi._count.followers,
        }}
        follow={{ canFollow, isFollowing }}
        contact={{ canContact, isBlocked: isContactBlocked, userInfo }}
        shareText={shareText}
      />

      {rabbi.messages.length > 0 && (
        <MessagesSlideshow
          messages={rabbi.messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          }))}
          rabbiName={rabbi.name}
        />
      )}

      <AboutCard bio={rabbi.bio} rabbiName={rabbi.name} />

      <WhatYouCanDo />

      {mediaEntries.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 justify-center sm:justify-start">
          {mediaEntries.map(([key, url]) => {
            const meta = MEDIA_META[key] ?? { label: key, icon: LinkIcon };
            const Icon = meta.icon;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-white text-xs text-ink-soft hover:border-primary hover:text-primary transition"
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </a>
            );
          })}
        </div>
      )}

      <StickyFollowCTA
        rabbiName={rabbi.name}
        canFollow={canFollow}
        initialFollowing={isFollowing}
        rabbiSlug={rabbi.slug}
      />

      {/* ===== Featured Lesson — Social Proof / Top hit ===== */}
      {featuredLesson && (
        <Link
          href={`/lesson/${featuredLesson.id}`}
          className="block mb-8 rounded-card border border-gold/40 bg-gradient-to-bl from-gold-soft/70 via-paper-warm to-white p-4 sm:p-5 hover:shadow-soft transition group"
        >
          <div className="flex items-start gap-4 flex-col sm:flex-row">
            <div className="w-14 h-14 shrink-0 rounded-full bg-gold/20 flex items-center justify-center">
              <Star className="w-7 h-7 text-gold fill-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">
                השיעור הפופולרי ביותר של הרב
              </div>
              <h3 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink group-hover:text-primary transition line-clamp-2">
                {featuredLesson.title}
              </h3>
              <div className="text-sm text-ink-soft mt-1 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {featuredLesson.viewCount.toLocaleString("he-IL")} צפיות
                </span>
                <span className="text-ink-muted">·</span>
                <span>{formatHebrewDate(featuredLesson.scheduledAt)}</span>
              </div>
            </div>
            <div className="shrink-0 self-center">
              <span className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold group-hover:bg-primary-hover transition">
                <Play className="w-4 h-4" />
                האזן עכשיו
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ===== Mini dashboard ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">
            {totalHours.toFixed(0)}
          </div>
          <div className="text-xs text-ink-muted">שעות שיעור</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">{totalLessons}</div>
          <div className="text-xs text-ink-muted">שיעורים</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">
            {totalViews.toLocaleString("he-IL")}
          </div>
          <div className="text-xs text-ink-muted">צפיות</div>
        </Card>
      </div>

      {/* ===== Upcoming lessons — calendar view ===== */}
      <section className="mb-10">
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" /> שיעורים מתוכננים
        </h2>
        {upcomingLessons.length === 0 ? (
          <Card>
            <CardDescription>אין שיעורים מתוכננים כעת.</CardDescription>
          </Card>
        ) : (
          <WeeklyCalendar
            title=""
            compact
            lessons={upcomingLessons.map((l) => ({
              id: l.id,
              title: l.title,
              rabbiName: rabbi.name,
              rabbiSlug: rabbi.slug,
              scheduledAt: l.scheduledAt.toISOString(),
              durationMin: l.durationMin ?? undefined,
              category: l.category?.name,
              broadcastType: l.broadcastType,
              isLive: l.isLive,
            }))}
          />
        )}

        {/* גם רשימה תחתונה — אם יש שיעורים מעבר לטווח של הלוח (יותר מ-14 יום) */}
        {(() => {
          const beyondCalendar = upcomingLessons.filter(
            (l) => new Date(l.scheduledAt).getTime() > Date.now() + 14 * 86400_000
          );
          if (beyondCalendar.length === 0) return null;
          return (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-primary hover:underline">
                ועוד {beyondCalendar.length} שיעורים מעבר לשבועיים הקרובים
              </summary>
              <div className="grid gap-2 mt-3">
                {beyondCalendar.map((l) => (
                  <Link key={l.id} href={`/lesson/${l.id}`} className="text-sm flex items-center justify-between gap-2 px-3 py-2 rounded-btn border border-border bg-white hover:border-primary/40">
                    <span className="font-medium text-ink truncate">{l.title}</span>
                    <span className="text-xs text-ink-muted shrink-0">{formatHebrewDate(l.scheduledAt)}</span>
                  </Link>
                ))}
              </div>
            </details>
          );
        })()}
      </section>

      {/* ===== ספרייה — הקלטות עדיין זמינות ===== */}
      {recordingsAvailable.length > 0 && (
        <section className="mb-10">
          <h2 className="hebrew-serif text-2xl font-bold text-ink mb-1 flex items-center gap-2">
            <Download className="w-6 h-6 text-gold" /> ספרייה — הקלטות זמינות
          </h2>
          <p className="text-sm text-ink-muted mb-4">
            השיעורים האחרונים שהוקלטו. כל הקלטה זמינה לזמן מוגבל — אחרי שהיא פגה היא נמחקת אוטומטית.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {recordingsAvailable.map((l: any) => (
              <Link
                key={l.id}
                href={`/lesson/${l.id}`}
                className="group block rounded-card border border-border bg-white p-4 hover:border-gold/40 hover:shadow-soft transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-ink line-clamp-2 flex-1">{l.title}</h3>
                  <ExpirationCountdown expiresAt={l.recordingExpiry} variant="chip" />
                </div>
                <div className="text-xs text-ink-muted">
                  {formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}
                  {l.durationMin && <> · {l.durationMin} דק׳</>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Archive (past lessons with filters) ===== */}
      <section className="mb-10">
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <Archive className="w-6 h-6 text-primary" /> ארכיון שיעורים
          <span className="text-base text-ink-muted font-normal">({pastLessons.length})</span>
        </h2>

        {/* Filters bar */}
        {pastLessons.length > 0 && (
          <form className="mb-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
            <label className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={filterQ}
                placeholder="חפש לפי כותרת..."
                className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <select
              name="type"
              defaultValue={filterType}
              className="h-11 px-3 rounded-btn border border-border bg-white text-sm"
            >
              <option value="">כל סוגי השיעורים</option>
              {BROADCAST_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>{bt.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                name="year"
                defaultValue={filterYear}
                className="flex-1 h-11 px-3 rounded-btn border border-border bg-white text-sm"
              >
                <option value="">כל השנים</option>
                {Array.from(new Set(pastLessons.map((l) => l.scheduledAt.getFullYear()))).sort((a, b) => b - a).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button type="submit" className="h-11 px-4 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover">סנן</button>
            </div>
          </form>
        )}

        {pastLessons.length === 0 ? (
          <Card>
            <CardDescription>עדיין אין שיעורים שהתקיימו.</CardDescription>
          </Card>
        ) : (() => {
          // === Apply filters ===
          let filtered = pastLessons;
          if (filterQ) filtered = filtered.filter((l) => l.title.toLowerCase().includes(filterQ));
          if (filterType) filtered = filtered.filter((l) => l.broadcastType === filterType);
          if (filterYear) filtered = filtered.filter((l) => l.scheduledAt.getFullYear() === parseInt(filterYear, 10));

          if (filtered.length === 0) {
            return (
              <Card>
                <CardDescription>
                  לא נמצאו שיעורים שמתאימים לסינון.{" "}
                  <Link href={`/rabbi/${rabbi.slug}`} className="text-primary hover:underline">נקה סינון</Link>
                </CardDescription>
              </Card>
            );
          }

          // Pagination
          const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
          const safePage = Math.min(currentPage, totalPages);
          const startIdx = (safePage - 1) * PAGE_SIZE;
          const pageLessons = filtered.slice(startIdx, startIdx + PAGE_SIZE);
          const pageLessonIds = new Set(pageLessons.map(l => l.id));

          // קטגוריות בעמוד הזה — רק אם אין סינון פעיל (אחרת מציגים שטוח)
          const showCategorized = !filterQ && !filterType && !filterYear;
          const catsInPage = showCategorized ? categoriesWithPast
            .map(cat => ({ ...cat, lessons: cat.lessons.filter(l => pageLessonIds.has(l.id)) }))
            .filter(c => c.lessons.length > 0) : [];
          const uncatInPage = showCategorized ? uncategorizedPast.filter(l => pageLessonIds.has(l.id)) : [];

          return (
            <>
              <div className="mb-3 text-sm text-ink-muted">
                מציג {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} מתוך {filtered.length} שיעורים
              </div>

              {showCategorized ? (
                <>
                  {catsInPage.map((cat) => (
                    <div key={cat.id} className="mb-8">
                      <h3 className="hebrew-serif text-xl font-bold text-ink mb-3">{cat.name}</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {cat.lessons.map((l) => (
                          <PastLessonCard key={l.id} lesson={l} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {uncatInPage.length > 0 && (
                    <div className="mb-8">
                      {catsInPage.length > 0 && (
                        <h3 className="hebrew-serif text-xl font-bold text-ink mb-3">כללי</h3>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {uncatInPage.map((l) => (
                          <PastLessonCard key={l.id} lesson={l} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Filtered view — flat grid, no categories */
                <div className="grid gap-3 sm:grid-cols-2">
                  {pageLessons.map((l) => (
                    <PastLessonCard key={l.id} lesson={l} />
                  ))}
                </div>
              )}

              {/* Pagination controls — שומרים את פרמטרי הסינון */}
              {totalPages > 1 && (() => {
                const baseParams = new URLSearchParams();
                if (filterQ) baseParams.set("q", filterQ);
                if (filterType) baseParams.set("type", filterType);
                if (filterYear) baseParams.set("year", filterYear);
                const pageHref = (p: number) => {
                  const u = new URLSearchParams(baseParams);
                  u.set("page", String(p));
                  return `?${u.toString()}`;
                };
                return (
                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="ניווט בין עמודים">
                  <Link
                    href={safePage > 1 ? pageHref(safePage - 1) : "#"}
                    aria-disabled={safePage === 1}
                    className={`min-w-[44px] h-11 px-4 inline-flex items-center justify-center rounded-btn border text-sm font-medium ${
                      safePage === 1
                        ? "border-border text-ink-muted bg-paper-soft cursor-not-allowed pointer-events-none"
                        : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                    }`}
                  >
                    הבא →
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-muted px-1">…</span>}
                        <Link
                          href={pageHref(p)}
                          className={`min-w-[44px] h-11 px-3 inline-flex items-center justify-center rounded-btn border text-sm font-medium transition ${
                            p === safePage
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                          }`}
                          aria-current={p === safePage ? "page" : undefined}
                        >
                          {p}
                        </Link>
                      </span>
                    ))}
                  <Link
                    href={safePage < totalPages ? pageHref(safePage + 1) : "#"}
                    aria-disabled={safePage === totalPages}
                    className={`min-w-[44px] h-11 px-4 inline-flex items-center justify-center rounded-btn border text-sm font-medium ${
                      safePage === totalPages
                        ? "border-border text-ink-muted bg-paper-soft cursor-not-allowed pointer-events-none"
                        : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                    }`}
                  >
                    ← הקודם
                  </Link>
                </nav>
                );
              })()}
            </>
          );
        })()}
      </section>

      {/* ===== Subscribe / Contact — CTA תחתון ===== */}
      <section className="mt-8 border-t border-border pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* התראות שיעורים חדשים */}
          <div className="rounded-card border border-primary/20 bg-gradient-to-br from-primary-soft via-white to-paper-soft p-5">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="hebrew-serif text-xl font-bold text-ink">קבל כל שיעור חדש במייל</h3>
            </div>
            <p className="text-sm text-ink-soft mb-4">
              {canFollow
                ? "עקוב אחרי הרב ותקבל התראה על כל שיעור חדש — חי או מוקלט."
                : "הירשם כתלמיד וקבל התראות על שיעורים חדשים של הרב במייל."}
            </p>
            {canFollow ? (
              <FollowButton rabbiId={rabbi.id} initialFollowing={isFollowing} canFollow={canFollow} />
            ) : (
              <Link
                href={`/register?next=/rabbi/${rabbi.slug}`}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
              >
                הירשם חינם
              </Link>
            )}
          </div>

          {/* צור קשר */}
          <div className="rounded-card border border-border bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-gold" />
              <h3 className="hebrew-serif text-xl font-bold text-ink">בקש שיעור או שאל שאלה</h3>
            </div>
            <p className="text-sm text-ink-soft mb-4">
              רוצה לבקש מהרב לדבר על נושא מסוים? שלח הודעה — הרב יקבל אותה ישירות.
            </p>
            <ContactRabbiButton
              rabbiId={rabbi.id}
              canSend={canContact}
              isBlocked={isContactBlocked}
              userInfo={userInfo}
            />
          </div>
        </div>

        {/* Share bar */}
        <div className="mt-6 text-center">
          <p className="text-xs text-ink-muted mb-2">עזור להפיץ תורה — שתף את הדף של הרב</p>
          <div className="inline-flex items-center gap-2 flex-wrap justify-center">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(rabbiUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-[#1877F2] text-white text-sm font-medium hover:opacity-90 transition"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Past lesson card ---------- */

type PastLesson = {
  id: string;
  title: string;
  scheduledAt: Date;
  viewCount: number;
  broadcastType: string;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  applePodcastUrl: string | null;
  soundcloudUrl: string | null;
  otherUrl: string | null;
  sourcesPdfUrl: string | null;
  sources: { id: string }[];
  description: string;
  posterUrl?: string | null;
};

function PastLessonCard({ lesson: l }: { lesson: PastLesson }) {
  const hasSourcesPage = l.sourcesPdfUrl || l.sources.length > 0;

  const mediaLinks: { href: string; label: string; Icon: typeof Youtube }[] =
    [];
  if (l.youtubeUrl)
    mediaLinks.push({ href: l.youtubeUrl, label: "YouTube", Icon: Youtube });
  if (l.spotifyUrl)
    mediaLinks.push({ href: l.spotifyUrl, label: "Spotify", Icon: Music });
  if (l.applePodcastUrl)
    mediaLinks.push({
      href: l.applePodcastUrl,
      label: "Apple Podcasts",
      Icon: Music,
    });
  if (l.soundcloudUrl)
    mediaLinks.push({
      href: l.soundcloudUrl,
      label: "SoundCloud",
      Icon: Music,
    });
  if (l.otherUrl)
    mediaLinks.push({ href: l.otherUrl, label: "קישור", Icon: LinkIcon });

  const poster = (l as any).posterUrl as string | null | undefined;
  return (
    <Card className="overflow-hidden p-0">
      <Link href={`/lesson/${l.id}`} className="block relative h-32 w-full overflow-hidden bg-paper-soft">
        {poster ? (
          <Image
            src={poster}
            alt={l.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover hover:scale-105 transition"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
            <LogoIcon className="w-20 h-20 opacity-40" />
          </div>
        )}
      </Link>
      <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/lesson/${l.id}`} className="hover:text-primary transition">
            <CardTitle>{l.title}</CardTitle>
          </Link>
          <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>{formatHebrewDate(l.scheduledAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {l.viewCount.toLocaleString("he-IL")}
            </span>
          </div>
        </div>
        <BroadcastTypeBadge value={l.broadcastType} />
      </div>

      {(mediaLinks.length > 0 || hasSourcesPage) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mediaLinks.map((m) => (
            <a
              key={m.href}
              href={m.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <m.Icon className="w-3.5 h-3.5" />
              {m.label}
            </a>
          ))}
          {hasSourcesPage && (
            <Link
              href={`/lesson/${l.id}#sources`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              דף מקורות
            </Link>
          )}
        </div>
      )}
      </div>
    </Card>
  );
}
