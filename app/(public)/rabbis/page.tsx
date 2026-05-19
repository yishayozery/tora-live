import Link from "next/link";
import Image from "next/image";
import { Search, Users, BookOpen, Heart, Radio, Calendar, UserPlus, Sparkles, GraduationCap, Clock, ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "רבני TORA LIVE | כל הרבנים בפלטפורמה",
  description:
    "רבני TORA LIVE — מהדתי-לאומי ועד החרדי, מהקהילות ועד הישיבות. שיעורי תורה חיים ומוקלטים ישירות מהאולפן של הרבנים המובילים בישראל.",
};

// ISR — רשימת רבנים מתעדכנת כל 5 דקות
export const revalidate = 300;

export default async function RabbisPage({
  searchParams,
}: {
  searchParams: { q?: string; follow?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const followFilter = searchParams.follow; // "yes" | "no" | undefined

  // רבנים שהמשתמש (אם מחובר) עוקב אחריהם
  const session = await getServerSession(authOptions);
  let followedIds = new Set<string>();
  if (session?.user?.id) {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (student) {
      const follows = await db.follow.findMany({
        where: { studentId: student.id },
        select: { rabbiId: true },
      });
      followedIds = new Set(follows.map((f) => f.rabbiId));
    }
  }
  const isLoggedIn = !!session?.user;

  // --- Parallel DB fetches — hero, stats, featured, list, live rabbis ---
  const [
    rabbis,
    featuredRaw,
    liveLesson,
    nextLive,
    totalRabbis,
    totalLessons,
    sumDuration,
    totalStudents,
    liveRabbiRows,
  ] = await Promise.all([
    db.rabbi.findMany({
      where: {
        status: "APPROVED",
        isBlocked: false,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { bio: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        photoUrl: true,
        _count: {
          select: {
            lessons: true,
            followers: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    // 3 רבנים מובילים לפי מספר עוקבים — תמיד גלובלי, גם כשיש חיפוש
    db.rabbi.findMany({
      where: { status: "APPROVED", isBlocked: false },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        photoUrl: true,
        _count: { select: { lessons: true, followers: true } },
      },
      orderBy: { followers: { _count: "desc" } },
      take: 3,
    }),
    // האם יש שידור חי כרגע?
    db.lesson.findFirst({
      where: {
        isLive: true,
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
        OR: [
          { rabbi: { status: "APPROVED", isBlocked: false } },
          { rabbiId: null },
        ],
      },
      select: { id: true },
    }),
    // אם אין שידור חי — שיעור חי קרוב
    db.lesson.findFirst({
      where: {
        isLive: false,
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
        scheduledAt: { gte: new Date() },
      },
      select: { id: true, scheduledAt: true },
      orderBy: { scheduledAt: "asc" },
    }),
    db.rabbi.count({ where: { status: "APPROVED", isBlocked: false } }),
    db.lesson.count({
      where: {
        approvalStatus: "APPROVED",
        isPublic: true,
        isSuspended: false,
      },
    }),
    db.lesson.aggregate({
      _sum: { durationMin: true },
      where: { approvalStatus: "APPROVED" },
    }),
    db.student.count(),
    // אילו רבנים משדרים כרגע — להצגת badge LIVE על כרטיסיהם
    db.lesson.findMany({
      where: {
        isLive: true,
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
        rabbiId: { not: null },
      },
      select: { rabbiId: true },
    }),
  ]);

  const liveRabbiIds = new Set(liveRabbiRows.map((l) => l.rabbiId!).filter(Boolean));
  const featuredIds = new Set(featuredRaw.map((r) => r.id));

  // סינון עוקב/לא-עוקב — רק אם המשתמש מחובר
  const filteredRabbis = isLoggedIn
    ? rabbis.filter((r) => {
        if (followFilter === "yes") return followedIds.has(r.id);
        if (followFilter === "no") return !followedIds.has(r.id);
        return true;
      })
    : rabbis;

  // ברשימה ה"כללית" — להוציא את ה-featured אם אין חיפוש/סינון
  const restRabbis =
    !q && !followFilter
      ? filteredRabbis.filter((r) => !featuredIds.has(r.id))
      : filteredRabbis;

  const totalHours = Math.round((sumDuration._sum.durationMin ?? 0) / 60);

  // CTA ראשי של ה-Hero
  const primaryCta = liveLesson
    ? { href: `/lesson/${liveLesson.id}`, label: "צפה בשיעור חי עכשיו", icon: "live" as const }
    : { href: "/#calendar", label: "ראה לוח שבועי", icon: "calendar" as const };

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="relative bg-gradient-to-bl from-primary via-primary to-primary-hover text-white overflow-hidden">
        {/* רקע דקורטיבי */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
            {totalRabbis.toLocaleString("he-IL")} רבני ישראל מלמדים כאן
          </span>

          <h1 className="font-display hebrew-serif mt-6 text-4xl sm:text-6xl font-bold leading-tight">
            רבני <span className="text-gold">TORA LIVE</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            כל הרבנים בפלטפורמה — מהדתי-לאומי ועד החרדי, מהקהילות ועד הישיבות.
            בחר לפי תחום, סגנון, או חיפוש חופשי.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-btn bg-gold text-ink font-bold shadow-card hover:bg-gold-hover transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 w-full sm:w-auto"
            >
              {primaryCta.icon === "live" ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
                  </span>
                  {primaryCta.label}
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                  {primaryCta.label}
                </>
              )}
            </Link>
            <Link
              href="/rabbis/join"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-btn bg-white/10 backdrop-blur border border-white/30 text-white font-semibold hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 w-full sm:w-auto"
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              אני רב — הצטרף
            </Link>
          </div>

          {!liveLesson && nextLive && (
            <p className="mt-5 text-sm text-white/70">
              השיעור החי הקרוב:{" "}
              <time dateTime={nextLive.scheduledAt.toISOString()}>
                {new Date(nextLive.scheduledAt).toLocaleString("he-IL", {
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </p>
          )}
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 text-center">
            <StatItem
              icon={<GraduationCap className="w-5 h-5" />}
              value={totalRabbis.toLocaleString("he-IL")}
              label="רבנים מאושרים"
            />
            <StatItem
              icon={<BookOpen className="w-5 h-5" />}
              value={totalLessons.toLocaleString("he-IL")}
              label="שיעורים"
            />
            <StatItem
              icon={<Clock className="w-5 h-5" />}
              value={totalHours.toLocaleString("he-IL")}
              label='שעות תורה סה"כ'
            />
            <StatItem
              icon={<Users className="w-5 h-5" />}
              value={totalStudents.toLocaleString("he-IL")}
              label="תלמידים רשומים"
            />
          </dl>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* ============ FEATURED RABBIS ============ */}
        {!q && !followFilter && featuredRaw.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-gold" aria-hidden="true" />
              <h2 className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink">
                רבנים מובילים
              </h2>
              <span className="h-px flex-1 bg-gradient-to-l from-gold/40 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredRaw.map((r) => (
                <FeaturedRabbiCard
                  key={r.id}
                  rabbi={r}
                  isFollowing={followedIds.has(r.id)}
                  isLive={liveRabbiIds.has(r.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ============ SEARCH + ALL RABBIS ============ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink">
              כל הרבנים
            </h2>
            <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </div>

          <form
            method="GET"
            className="mb-6 flex flex-col sm:flex-row gap-3 bg-white border border-border rounded-card shadow-soft p-3"
            role="search"
            aria-label="חיפוש רבנים"
          >
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
              <label htmlFor="rabbi-q" className="sr-only">חיפוש רב</label>
              <input
                id="rabbi-q"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="חפש רב לפי שם או נושא…"
                className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-paper-soft text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            {isLoggedIn && followFilter && <input type="hidden" name="follow" value={followFilter} />}
            <button
              type="submit"
              className="h-11 px-6 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
            >
              חפש
            </button>
          </form>

          {/* Follow filter tabs — רק למשתמשים מחוברים */}
          {isLoggedIn && (
            <div className="mb-6 flex gap-2 flex-wrap items-center">
              <span className="text-sm text-ink-muted">סינון:</span>
              <Link
                href={`/rabbis${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                className={`h-9 px-4 rounded-btn text-sm font-medium border transition ${!followFilter ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"}`}
              >
                הכל ({rabbis.length})
              </Link>
              <Link
                href={`/rabbis?${new URLSearchParams({ ...(q ? { q } : {}), follow: "yes" }).toString()}`}
                className={`h-9 px-4 rounded-btn text-sm font-medium border transition inline-flex items-center gap-1.5 ${followFilter === "yes" ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"}`}
              >
                <Heart className={`w-3.5 h-3.5 ${followFilter === "yes" ? "fill-current" : ""}`} />
                עוקב ({followedIds.size})
              </Link>
              <Link
                href={`/rabbis?${new URLSearchParams({ ...(q ? { q } : {}), follow: "no" }).toString()}`}
                className={`h-9 px-4 rounded-btn text-sm font-medium border transition ${followFilter === "no" ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"}`}
              >
                גלה חדשים ({rabbis.length - followedIds.size})
              </Link>
              <Link
                href="/my/rabbis"
                className="h-9 px-4 rounded-btn text-sm font-medium mr-auto text-primary hover:underline"
              >
                למעקב ושליחת הודעות ←
              </Link>
            </div>
          )}

          <div className="mb-4 text-sm text-ink-muted">
            {restRabbis.length} רבנים{followFilter === "yes" ? " שאתה עוקב" : followFilter === "no" ? " חדשים" : ""}
          </div>

          {restRabbis.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-card">
              <p className="text-ink-muted">
                {q ? "לא נמצאו רבנים התואמים את החיפוש." : followFilter === "yes" ? "עוד אין רבנים שאתה עוקב." : "עדיין אין רבנים רשומים."}
              </p>
              {(q || followFilter) && (
                <Link
                  href="/rabbis"
                  className="mt-4 inline-block text-primary font-semibold hover:underline"
                >
                  נקה סינון
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {restRabbis.map((r) => (
                <RabbiGalleryCard
                  key={r.id}
                  rabbi={r}
                  isFollowing={followedIds.has(r.id)}
                  isLive={liveRabbiIds.has(r.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============ CLOSING CTA — "לא מצאת את הרב שלך?" ============ */}
        <ClosingCta />
      </div>
    </main>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
        {icon}
      </span>
      <dt className="font-display hebrew-serif text-2xl sm:text-3xl font-bold text-ink leading-none">
        {value}
      </dt>
      <dd className="text-xs sm:text-sm text-ink-muted">{label}</dd>
    </div>
  );
}

type RabbiCardData = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  _count: { lessons: number; followers: number };
};

function initialsOf(name: string) {
  return name
    .replace("הרב ", "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-live rounded-full px-2 py-0.5 shadow-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
      </span>
      LIVE
    </span>
  );
}

function RabbiAvatar({
  photoUrl,
  name,
  size,
}: {
  photoUrl: string | null;
  name: string;
  size: number;
}) {
  if (photoUrl) {
    if (photoUrl.startsWith("data:")) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={photoUrl}
          alt={name}
          style={{ height: size, width: size }}
          className="shrink-0 rounded-full object-cover ring-2 ring-gold-soft ring-offset-2"
        />
      );
    }
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ height: size, width: size }}
        className="shrink-0 rounded-full object-cover ring-2 ring-gold-soft ring-offset-2"
      />
    );
  }
  return (
    <div
      style={{ height: size, width: size, fontSize: size / 3 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold/30 font-serif font-bold text-gold ring-2 ring-gold-soft ring-offset-2"
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}

function FeaturedRabbiCard({
  rabbi,
  isFollowing,
  isLive,
}: {
  rabbi: RabbiCardData;
  isFollowing?: boolean;
  isLive?: boolean;
}) {
  const tagline =
    rabbi.bio?.split(/[.\n]/).find((s) => s.trim().length > 5)?.trim().slice(0, 100) ??
    "מורה תורה ב-TORA LIVE";

  return (
    <article className="relative card group flex flex-col p-6 transition border-gold/30 bg-gradient-to-br from-white to-amber-50/40 hover:border-gold/60 hover:shadow-card hover:-translate-y-1 duration-200">
      <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-gold bg-gold-soft border border-gold/30 rounded-full px-2 py-0.5">
        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
        מוביל
      </span>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <RabbiAvatar photoUrl={rabbi.photoUrl} name={rabbi.name} size={104} />
          {isLive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <LiveBadge />
            </span>
          )}
        </div>
        <h3 className="hebrew-serif font-display text-xl font-bold text-ink mt-4 group-hover:text-primary transition">
          {rabbi.name}
        </h3>
        <p className="text-sm text-ink-soft mt-2 line-clamp-3 min-h-[3.75rem]">{tagline}</p>

        <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {rabbi._count.lessons.toLocaleString("he-IL")} שיעורים
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {rabbi._count.followers.toLocaleString("he-IL")} עוקבים
          </span>
        </div>
      </div>

      <Link
        href={`/rabbi/${rabbi.slug}`}
        className="mt-5 inline-flex items-center justify-center gap-1 h-11 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={`מעבר לדף ${rabbi.name}`}
      >
        לדף הרב
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </Link>

      {isFollowing && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
          <Heart className="w-2.5 h-2.5 fill-current" />
          עוקב
        </span>
      )}
    </article>
  );
}

function RabbiGalleryCard({
  rabbi,
  isFollowing,
  isLive,
}: {
  rabbi: RabbiCardData;
  isFollowing?: boolean;
  isLive?: boolean;
}) {
  // tagline אוטומטי — שורה ראשונה של ה-bio (או fallback)
  const tagline =
    rabbi.bio?.split(/[.\n]/).find((s) => s.trim().length > 5)?.trim().slice(0, 90) ??
    (rabbi._count.lessons > 50
      ? "מורה מוערך · עשרות שיעורים"
      : rabbi._count.lessons > 10
        ? "פעיל בהוראת תורה"
        : "רב חדש בפלטפורמה");

  return (
    <article className="card group flex flex-col p-5 transition hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5 duration-200">
      <div className="flex items-start gap-4">
        <div className="relative">
          <RabbiAvatar photoUrl={rabbi.photoUrl} name={rabbi.name} size={80} />
          {isLive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <LiveBadge />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="hebrew-serif text-lg font-bold text-ink group-hover:text-primary transition leading-tight">
              {rabbi.name}
            </h3>
            {isFollowing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                <Heart className="w-2.5 h-2.5 fill-current" />
                עוקב
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-1 line-clamp-3">{tagline}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {rabbi._count.lessons}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {rabbi._count.followers.toLocaleString("he-IL")}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`/rabbi/${rabbi.slug}`}
        className="mt-5 inline-flex items-center justify-center h-10 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={`מעבר לדף ${rabbi.name}`}
      >
        לדף הרב
      </Link>
    </article>
  );
}

function ClosingCta() {
  // WhatsApp link עם הודעה מוכנה לצוות TORA LIVE
  const waText = encodeURIComponent(
    "היי, יש רב שכדאי לכם להזמין ל-TORA LIVE: "
  );
  // mailto fallback — שדה האימייל פותח לקוח מייל עם הנושא והגוף מוכנים
  const mailtoSubject = encodeURIComponent("המלצה על רב ל-TORA LIVE");
  const mailtoBody = encodeURIComponent(
    "שלום, אני רוצה להמליץ על הרב הבא להצטרף ל-TORA LIVE:\n\nשם הרב:\nקהילה / ישיבה:\nאיך אפשר ליצור קשר:\n\nבאיזה אימייל לעדכן אותי כשיצטרף:\n"
  );

  return (
    <section className="mt-16 sm:mt-20">
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-hover text-white p-6 sm:p-10 shadow-card">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-2xl">
          <h2 className="font-display hebrew-serif text-2xl sm:text-3xl font-bold">
            לא מצאת את הרב שלך? אנחנו מזמינים אותו
          </h2>
          <p className="mt-3 text-white/85 text-sm sm:text-base">
            המלץ לרב על TORA LIVE — נעדכן אותך כשיצטרף. ניתן לשלוח בוואטסאפ או באימייל.
          </p>

          <form
            action={`mailto:hello@tora-live.com?subject=${mailtoSubject}&body=${mailtoBody}`}
            method="POST"
            encType="text/plain"
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="recommend-email" className="sr-only">
              האימייל שלך
            </label>
            <input
              id="recommend-email"
              type="email"
              name="email"
              required
              placeholder="האימייל שלך — נעדכן אותך"
              className="flex-1 h-11 px-4 rounded-btn bg-white/10 backdrop-blur border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 focus:border-white/60 transition"
            />
            <button
              type="submit"
              className="h-11 px-6 rounded-btn bg-gold text-ink font-bold hover:bg-gold-hover transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
            >
              שלח המלצה
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="text-white/70">או</span>
            <a
              href={`https://wa.me/972500000000?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gold-soft font-semibold hover:text-white transition underline underline-offset-4"
            >
              <Radio className="w-4 h-4" aria-hidden="true" />
              שלח בוואטסאפ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
