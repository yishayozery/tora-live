import Link from "next/link";
import Image from "next/image";
import { Search, Users, BookOpen, Heart } from "lucide-react";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "רבנים | TORA LIVE",
  description:
    "גלה רבנים מכל גווני הקשת — שיעורי תורה חיים ומוקלטים ישירות מהאולפן של הרבנים המובילים בישראל.",
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

  const rabbis = await db.rabbi.findMany({
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
  });

  // סינון עוקב/לא-עוקב — רק אם המשתמש מחובר
  const filteredRabbis = isLoggedIn
    ? rabbis.filter((r) => {
        if (followFilter === "yes") return followedIds.has(r.id);
        if (followFilter === "no") return !followedIds.has(r.id);
        return true;
      })
    : rabbis;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <header className="text-center mb-10">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">
          רבני <span className="text-primary">TORA LIVE</span>
        </h1>
        <p className="mt-4 text-lg text-ink-soft max-w-2xl mx-auto">
          גלה רבנים מכל גווני הקשת — מחפשי דף יומי, פרשת שבוע, הלכה יומית או
          מחשבה. כל רב והסגנון שלו.
        </p>
      </header>

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
        {filteredRabbis.length} רבנים{followFilter === "yes" ? " שאתה עוקב" : followFilter === "no" ? " חדשים" : ""}
      </div>

      {filteredRabbis.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRabbis.map((r) => (
            <RabbiGalleryCard key={r.id} rabbi={r} isFollowing={followedIds.has(r.id)} />
          ))}
        </div>
      )}
    </main>
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

function RabbiGalleryCard({ rabbi, isFollowing }: { rabbi: RabbiCardData; isFollowing?: boolean }) {
  const initials = rabbi.name
    .replace("הרב ", "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  // tagline אוטומטי — שורה ראשונה של ה-bio (או fallback)
  const tagline = rabbi.bio?.split(/[.\n]/).find((s) => s.trim().length > 5)?.trim().slice(0, 60)
    ?? (rabbi._count.lessons > 50 ? "מורה מוערך · עשרות שיעורים" : rabbi._count.lessons > 10 ? "פעיל בהוראת תורה" : "רב חדש בפלטפורמה");

  return (
    <article className="card group flex flex-col p-5 transition hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        {rabbi.photoUrl ? (
          rabbi.photoUrl.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rabbi.photoUrl} alt={rabbi.name} className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-gold-soft ring-offset-2" />
          ) : (
            <Image
              src={rabbi.photoUrl}
              alt={rabbi.name}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-gold-soft ring-offset-2"
            />
          )
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold/30 font-serif text-2xl font-bold text-gold ring-2 ring-gold-soft ring-offset-2"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="hebrew-serif text-lg font-bold text-ink group-hover:text-primary transition leading-tight">
              {rabbi.name}
            </h2>
            {isFollowing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                <Users className="w-2.5 h-2.5" />
                עוקב
              </span>
            )}
          </div>
          {/* Tagline — אישיות במשפט אחד */}
          <p className="text-xs text-ink-soft mt-1 line-clamp-1">{tagline}</p>
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
