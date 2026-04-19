import Link from "next/link";
import Image from "next/image";
import { Search, Users, BookOpen } from "lucide-react";
import { db } from "@/lib/db";

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
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

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
        className="mb-10 flex flex-col sm:flex-row gap-3 bg-white border border-border rounded-card shadow-soft p-3"
        role="search"
        aria-label="חיפוש רבנים"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
          <label htmlFor="rabbi-q" className="sr-only">
            חיפוש רב
          </label>
          <input
            id="rabbi-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="חפש רב לפי שם או נושא…"
            className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-paper-soft text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-6 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
        >
          חפש
        </button>
      </form>

      <div className="mb-4 text-sm text-ink-muted">
        {rabbis.length} רבנים נמצאו
      </div>

      {rabbis.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-card">
          <p className="text-ink-muted">
            {q ? "לא נמצאו רבנים התואמים את החיפוש." : "עדיין אין רבנים רשומים."}
          </p>
          {q && (
            <Link
              href="/rabbis"
              className="mt-4 inline-block text-primary font-semibold hover:underline"
            >
              נקה חיפוש
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rabbis.map((r) => (
            <RabbiGalleryCard key={r.id} rabbi={r} />
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

function RabbiGalleryCard({ rabbi }: { rabbi: RabbiCardData }) {
  const initials = rabbi.name
    .replace("הרב ", "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <article className="card group flex flex-col p-6 transition hover:border-primary/40 hover:shadow-card">
      <div className="flex items-center gap-4">
        {rabbi.photoUrl ? (
          rabbi.photoUrl.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rabbi.photoUrl} alt={rabbi.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <Image
              src={rabbi.photoUrl}
              alt={rabbi.name}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          )
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-2xl font-bold text-gold"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="hebrew-serif text-xl font-bold text-ink group-hover:text-primary transition">
            {rabbi.name}
          </h2>
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-subtle">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {rabbi._count.lessons} שיעורים
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {rabbi._count.followers.toLocaleString("he-IL")} עוקבים
            </span>
          </div>
        </div>
      </div>

      {rabbi.bio && rabbi.bio.trim() !== "" && (
        <p className="mt-4 line-clamp-2 text-sm text-ink-muted flex-1">
          {rabbi.bio}
        </p>
      )}

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
