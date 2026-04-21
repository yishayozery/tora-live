import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { LogoIcon } from "@/components/Logo";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { Tag } from "lucide-react";

const SITE = "https://torah-live-rho.vercel.app";

const TOPIC_LABELS: Record<string, string> = {
  "halacha": "הלכה",
  "parsha": "פרשת שבוע",
  "daf-yomi": "דף יומי",
  "mussar": "מוסר",
  "machshava": "מחשבה",
  "tanya": "תניא וחסידות",
  "tehillim": "תהילים",
  "tefilah": "תפילה",
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "halacha": ["הלכה", "פסק", "שו\"ע"],
  "parsha": ["פרש", "פרשת"],
  "daf-yomi": ["דף יומי", "דף", "גמרא"],
  "mussar": ["מוסר", "מידות"],
  "machshava": ["מחשב", "השקפ"],
  "tanya": ["תניא", "חסיד"],
  "tehillim": ["תהיל"],
  "tefilah": ["תפיל"],
};

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.name);
  const label = TOPIC_LABELS[slug] ?? slug;
  return {
    title: `שיעורי ${label} | TORA_LIVE`,
    description: `כל שיעורי ה${label} ב-TORA_LIVE — שידורים חיים, הקלטות ושיעורים מתוזמנים מרבני המגזר`,
    openGraph: {
      title: `שיעורי ${label}`,
      description: `שיעורי ${label} מרבנים מובילים`,
      url: `${SITE}/topic/${slug}`,
      type: "website",
    },
  };
}

export const revalidate = 300;

export default async function TopicPage({ params }: { params: { name: string } }) {
  const slug = decodeURIComponent(params.name);
  const label = TOPIC_LABELS[slug] ?? slug;
  const keywords = TOPIC_KEYWORDS[slug] ?? [slug];

  // Find lessons matching any of the keywords in title/description/category
  const lessons = await db.lesson.findMany({
    where: {
      approvalStatus: "APPROVED",
      isPublic: true,
      isSuspended: false,
      OR: [
        ...keywords.flatMap((k) => [
          { title: { contains: k } },
          { description: { contains: k } },
          { category: { name: { contains: k } } },
        ]),
      ],
    },
    include: { rabbi: { select: { name: true, slug: true } }, category: true },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });

  const now = new Date();
  const upcoming = lessons.filter((l) => l.scheduledAt >= now);
  const past = lessons.filter((l) => l.scheduledAt < now).slice(0, 30);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold-soft px-3 py-1.5 rounded-full mb-3">
          <Tag className="w-3.5 h-3.5" />
          נושא לימוד
        </div>
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">שיעורי {label}</h1>
        <p className="mt-3 text-ink-soft">{lessons.length} שיעורים זמינים — חיים, הקלטות, ומתוזמנים</p>
      </header>

      {lessons.length === 0 ? (
        <Card>
          <CardDescription className="text-center py-8">
            עדיין אין שיעורים בנושא זה.{" "}
            <Link href="/lessons" className="text-primary hover:underline">דפדף בכל השיעורים</Link>
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4">
                קרובים ({upcoming.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((l) => <LessonRow key={l.id} l={l} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4">
                הקלטות אחרונות
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((l) => <LessonRow key={l.id} l={l} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Other topics */}
      <section className="mt-12 text-center">
        <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">נושאים נוספים</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(TOPIC_LABELS).filter(([s]) => s !== slug).map(([s, l]) => (
            <Link
              key={s}
              href={`/topic/${s}`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border bg-white text-ink-soft text-sm hover:border-primary hover:text-primary transition"
            >
              <Tag className="w-3 h-3" />
              {l}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function LessonRow({ l }: { l: any }) {
  return (
    <Link href={`/lesson/${l.id}`} className="card group block overflow-hidden hover:border-primary/40 hover:shadow-soft transition">
      <div className="relative h-32 bg-paper-soft overflow-hidden">
        {l.posterUrl ? (
          <Image src={l.posterUrl} alt={l.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
            <LogoIcon className="w-20 h-20 opacity-40" />
          </div>
        )}
      </div>
      <div className="p-4">
        <BroadcastTypeBadge value={l.broadcastType} />
        <h3 className="font-bold text-ink line-clamp-2 mt-2 group-hover:text-primary transition">{l.title}</h3>
        <div className="text-xs text-ink-muted mt-1">
          {l.rabbi?.name ?? l.organizerName ?? "—"} · {formatHebrewDate(l.scheduledAt)}
        </div>
      </div>
    </Link>
  );
}
