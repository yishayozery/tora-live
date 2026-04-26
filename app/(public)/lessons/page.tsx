import Link from "next/link";
import Image from "next/image";
import { LessonSearch, type SearchOptions } from "@/components/LessonSearch";
import { LogoIcon } from "@/components/Logo";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { broadcastTypeMeta, BROADCAST_TYPES, LANGUAGES } from "@/lib/enums";
import { db } from "@/lib/db";
import { Clock, Calendar as CalIcon } from "lucide-react";

export const metadata = {
  title: "שיעורים | TORA LIVE",
  description: "חפש ומצא שיעורי תורה חיים ומוקלטים לפי רב, נושא, תאריך ושעה.",
};

// ISR — קטלוג שיעורים מתעדכן כל דקה. searchParams עדיין dynamic.
export const revalidate = 60;

type LessonRow = {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  durationMin: number | null;
  language: string;
  broadcastType: string;
  isLive: boolean;
  rabbi: { slug: string; name: string; id: string };
  category: { name: string } | null;
};

function isToday(d: Date) {
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
function isTomorrow(d: Date) {
  const n = new Date();
  n.setDate(n.getDate() + 1);
  return d.toDateString() === n.toDateString();
}
function inDays(d: Date, days: number) {
  const diff = d.getTime() - Date.now();
  return diff >= 0 && diff <= days * 86400 * 1000;
}

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: {
    q?: string; rabbi?: string; topic?: string; date?: string;
    time?: string; tag?: string; type?: string; lang?: string; sort?: string;
  };
}) {
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 30 * 86400 * 1000);

  // שליפת כל השיעורים הציבוריים של רבנים מאושרים — עתידיים ועכשוויים
  const rawLessons = await db.lesson.findMany({
    where: {
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      OR: [
        { rabbi: { status: "APPROVED", isBlocked: false } },
        { rabbiId: null },
      ],
      scheduledAt: { gte: new Date(now.getTime() - 2 * 3600 * 1000) }, // מ-2 שעות אחורה (כדי לראות שידורים עכשיו)
    },
    include: {
      rabbi: { select: { id: true, slug: true, name: true } },
      category: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 200,
  });

  // שליפת רבנים לצורך פילטר
  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    select: { slug: true, name: true, _count: { select: { lessons: true } } },
    orderBy: { name: "asc" },
  });

  // בניית options לחיפוש
  const options: SearchOptions = {
    rabbis: rabbis.map((r) => ({ value: r.slug, label: r.name, count: r._count.lessons })),
    topics: [
      { value: "daf-yomi", label: "דף יומי" },
      { value: "halacha", label: "הלכה" },
      { value: "parsha", label: "פרשת שבוע" },
      { value: "mussar", label: "מוסר" },
      { value: "tanya", label: "חסידות" },
      { value: "machshava", label: "מחשבה" },
    ],
    broadcastTypes: BROADCAST_TYPES.map((b) => ({ value: b.value, label: b.label })),
    languages: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
  };

  // סינון
  const filtered = rawLessons.filter((l: any) => {
    if (searchParams.q) {
      const q = searchParams.q.toLowerCase();
      if (!`${l.title} ${l.description}`.toLowerCase().includes(q)) return false;
    }
    if (searchParams.rabbi && l.rabbi?.slug !== searchParams.rabbi) return false;
    if (searchParams.type && l.broadcastType !== searchParams.type) return false;
    if (searchParams.lang && l.language !== searchParams.lang) return false;
    if (searchParams.date) {
      if (searchParams.date === "today" && !isToday(l.scheduledAt)) return false;
      if (searchParams.date === "tomorrow" && !isTomorrow(l.scheduledAt)) return false;
      if (searchParams.date === "week" && !inDays(l.scheduledAt, 7)) return false;
      if (searchParams.date === "month" && !inDays(l.scheduledAt, 30)) return false;
    }
    if (searchParams.time) {
      const h = l.scheduledAt.getHours();
      if (searchParams.time === "morning" && !(h >= 6 && h < 12)) return false;
      if (searchParams.time === "noon" && !(h >= 12 && h < 16)) return false;
      if (searchParams.time === "evening" && !(h >= 16 && h < 20)) return false;
      if (searchParams.time === "night" && !(h >= 20 || h < 6)) return false;
    }
    return true;
  });

  const sort = searchParams.sort ?? "upcoming";
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return b.scheduledAt.getTime() - a.scheduledAt.getTime();
    return a.scheduledAt.getTime() - b.scheduledAt.getTime();
  });

  const hasAnyFilter = !!(
    searchParams.q || searchParams.rabbi || searchParams.type || searchParams.lang ||
    searchParams.date || searchParams.time
  );
  const activeTypeMeta = searchParams.type ? broadcastTypeMeta(searchParams.type) : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <header className="text-center mb-8">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">
          {activeTypeMeta && activeTypeMeta.value !== "LESSON" ? (
            <span className="text-primary">{activeTypeMeta.label}</span>
          ) : (
            <>
              שיעורי <span className="text-primary">תורה</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-lg text-ink-soft max-w-2xl mx-auto">
          {activeTypeMeta && activeTypeMeta.value !== "LESSON"
            ? activeTypeMeta.description
            : "חפש שיעור לפי רב, נושא, תאריך ושעה."}
        </p>
      </header>

      <div className="max-w-3xl mx-auto mb-8">
        <LessonSearch options={options} />
      </div>

      {/* תוצאות */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="text-sm text-ink-muted">
          {hasAnyFilter ? (
            <>נמצאו <span className="font-bold text-ink">{sorted.length}</span> תוצאות</>
          ) : (
            <>סה״כ <span className="font-bold text-ink">{sorted.length}</span> שיעורים</>
          )}
        </div>
        {hasAnyFilter && (
          <Link href="/lessons" className="text-sm text-primary hover:underline">
            נקה סינון
          </Link>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-muted text-lg mb-4">לא נמצאו שיעורים תואמים</p>
          {hasAnyFilter && (
            <Link href="/lessons" className="text-primary hover:underline">נקה סינון</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l: any) => {
            const rabbiName = l.rabbi?.name ?? l.organizerName ?? "אירוע";
            return (
              <Link
                key={l.id}
                href={`/lesson/${l.id}`}
                className="group block overflow-hidden rounded-card border border-border bg-white hover:border-primary/40 hover:shadow-soft transition"
              >
                <div className="relative h-32 w-full overflow-hidden bg-paper-soft">
                  {l.posterUrl ? (
                    <Image
                      src={l.posterUrl}
                      alt={l.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
                      <LogoIcon className="w-20 h-20 opacity-40" />
                    </div>
                  )}
                  {l.isLive && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                      </span>
                      LIVE
                    </span>
                  )}
                  {l.durationMin && !l.isLive && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                      {l.durationMin >= 60 ? `${Math.floor(l.durationMin / 60)}:${String(l.durationMin % 60).padStart(2, "0")} שע׳` : `${l.durationMin} דק׳`}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-2"><BroadcastTypeBadge value={l.broadcastType} /></div>
                  <h3 className="font-bold text-ink line-clamp-2 mb-2 group-hover:text-primary transition">{l.title}</h3>
                  <p className="text-xs text-ink-muted line-clamp-2 mb-3">{l.description}</p>
                  <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                    <span className="font-medium text-ink-soft">{rabbiName}</span>
                    <span className="flex items-center gap-1">
                      <CalIcon className="w-3 h-3" />
                      {new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", { day: "numeric", month: "long" }).format(l.scheduledAt)} · {new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(l.scheduledAt)}
                    </span>
                    {l.durationMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {l.durationMin} דק׳
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
