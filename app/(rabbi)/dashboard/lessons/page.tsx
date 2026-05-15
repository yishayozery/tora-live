import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { formatHebrewDate } from "@/lib/utils";
import { Archive, Eye, Youtube, Music, Link as LinkIcon, ExternalLink, Download, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { LessonRowActions } from "@/components/rabbi/LessonRowActions";

function daysUntil(date: Date): number {
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

type SearchParams = {
  q?: string;
  year?: string;
  type?: string;
};

export default async function LessonsArchivePage({ searchParams }: { searchParams?: SearchParams }) {
  const { rabbi } = await requireApprovedRabbi();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const q = (searchParams?.q ?? "").trim();
  const year = searchParams?.year ?? "";
  const type = searchParams?.type ?? "";

  // טווח השנה שנבחרה — אם נבחרה. תמיד עד תחילת היום (לא לוכדים שיעורים עתידיים).
  let dateFilter: { gte?: Date; lt: Date };
  if (year && /^\d{4}$/.test(year)) {
    const y = parseInt(year, 10);
    const yearStart = new Date(y, 0, 1);
    const yearEnd = new Date(y + 1, 0, 1);
    dateFilter = {
      gte: yearStart,
      lt: yearEnd.getTime() < startOfToday.getTime() ? yearEnd : startOfToday,
    };
  } else {
    dateFilter = { lt: startOfToday };
  }

  // הארכיון כולל:
  // 1. שיעורים שהתאריך שלהם עבר (לפי dateFilter)
  // 2. שיעורים שכבר שודרו (streamId לא null), גם אם התאריך שלהם עתידי — הם עברו לארכיון אחרי שידור.
  // מקרי קצה: אם המשתמש בחר שנה ספציפית — מסננים רק לפי תאריך (לא נכלל שודרו עתידיים בשנה הנוכחית).
  const past = await db.lesson.findMany({
    where: {
      rabbiId: rabbi.id,
      OR: year
        ? [{ scheduledAt: dateFilter }]
        : [{ scheduledAt: dateFilter }, { streamId: { not: null }, isLive: false }],
      broadcastType: type ? type : { not: "PREP" },
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { category: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { scheduledAt: "desc" },
    include: { category: true },
    take: 100,
  });

  // שנים זמינות לפילטר
  const allLessons = await db.lesson.findMany({
    where: { rabbiId: rabbi.id, scheduledAt: { lt: startOfToday } },
    select: { scheduledAt: true },
  });
  const years = Array.from(new Set(allLessons.map((l) => l.scheduledAt.getFullYear()))).sort((a, b) => b - a);

  const hasFilter = !!(q || year || type);
  const totalCount = await db.lesson.count({
    where: { rabbiId: rabbi.id, scheduledAt: { lt: startOfToday }, broadcastType: { not: "PREP" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
            <Archive className="w-7 h-7 text-primary" /> ארכיון השיעורים
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            כל השיעורים שמסרת בעבר, עם הקלטות וקישורי מדיה. ההקלטות זמינות 30 יום מסיום השידור.
          </p>
        </div>
        <Link
          href="/dashboard/lessons/new"
          className="h-11 px-5 inline-flex items-center rounded-btn bg-primary text-white hover:bg-primary-hover"
        >
          + שיעור חדש
        </Link>
      </div>

      {/* חיפוש + פילטרים */}
      <form action="/dashboard/lessons" method="get" className="bg-white rounded-card border border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="חפש לפי כותרת, תיאור או נושא"
              className="w-full h-11 ps-9 pe-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            name="year"
            defaultValue={year}
            className="h-11 px-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">כל השנים</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={type}
            className="h-11 px-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">כל הסוגים</option>
            <option value="LESSON">שיעור תורה</option>
            <option value="PRAYER">תפילה</option>
            <option value="OTHER">אחר</option>
          </select>
          <button
            type="submit"
            className="h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover whitespace-nowrap"
          >
            חפש
          </button>
          {hasFilter && (
            <Link
              href="/dashboard/lessons"
              className="h-11 px-3 inline-flex items-center rounded-btn text-sm text-ink-muted hover:text-ink"
            >
              נקה
            </Link>
          )}
        </div>
        <div className="mt-2 text-xs text-ink-muted">
          {hasFilter ? (
            <>נמצאו <span className="font-bold text-ink">{past.length}</span> שיעורים מתוך {totalCount}</>
          ) : (
            <>סה״כ <span className="font-bold text-ink">{totalCount}</span> שיעורים בארכיון</>
          )}
        </div>
      </form>

      {/* רשימה */}
      <PastList lessons={past} now={now} />
    </div>
  );
}

function PastList({ lessons, now }: { lessons: any[]; now: Date }) {
  if (lessons.length === 0) {
    return (
      <Card>
        <CardDescription>
          עדיין לא נמצאו שיעורים בארכיון. שיעורים שתאריכם חלף יופיעו כאן עם קישורי המדיה וההקלטות.
        </CardDescription>
      </Card>
    );
  }

  return (
    <>
      {/* טבלה לדסקטופ */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-card border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-paper-soft text-ink-muted text-right">
              <th className="py-2 px-3 font-medium">כותרת</th>
              <th className="py-2 px-3 font-medium">תאריך</th>
              <th className="py-2 px-3 font-medium">משך</th>
              <th className="py-2 px-3 font-medium">צפיות</th>
              <th className="py-2 px-3 font-medium">מדיה</th>
              <th className="py-2 px-3 font-medium">הקלטה</th>
              <th className="py-2 px-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => {
              const hasRecording =
                !!l.playbackUrl && l.recordingExpiry !== null && l.recordingExpiry > now;
              const daysLeft = hasRecording ? daysUntil(l.recordingExpiry as Date) : 0;
              // קיים stream ID אבל אין URL → הקלטה לא הופיעה עדיין / לא זמינה
              const streamButNoUrl = !!l.streamId && !l.playbackUrl && !l.recordingUrl;
              return (
                <tr key={l.id} className="border-t border-border hover:bg-paper-soft/50 transition">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink truncate">{l.title}</span>
                      <BroadcastTypeBadge value={(l as any).broadcastType} />
                    </div>
                    {l.category && <div className="text-xs text-ink-muted">{l.category.name}</div>}
                  </td>
                  <td className="py-2 px-3 text-ink-muted whitespace-nowrap">{formatHebrewDate(l.scheduledAt)}</td>
                  <td className="py-2 px-3 text-ink-muted whitespace-nowrap">
                    {l.durationMin ? `${l.durationMin} דק׳` : "—"}
                  </td>
                  <td className="py-2 px-3 text-ink-muted whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {l.viewCount.toLocaleString("he-IL")}
                    </span>
                  </td>
                  <td className="py-2 px-3"><MediaLinks lesson={l} /></td>
                  <td className="py-2 px-3">
                    {hasRecording ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-live" aria-label="הקלטה זמינה" />
                        <a
                          href={l.recordingUrl ?? `/api/lessons/${l.id}/download`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-gold-soft text-gold hover:bg-gold/20 px-2 py-1 rounded-btn transition"
                          title={`זמין עוד ${daysLeft} ימים`}
                        >
                          <Download className="w-3.5 h-3.5" /> הורדה
                          <span className="text-[10px] opacity-75">({daysLeft}ד׳)</span>
                        </a>
                      </div>
                    ) : streamButNoUrl ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gold" title="ההקלטה עדיין בעיבוד או לא הצליחה">
                        <AlertCircle className="w-3.5 h-3.5" /> בעיבוד
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link href={`/lesson/${l.id}`} className="text-primary text-xs hover:underline inline-flex items-center gap-1">
                        לשיעור <ExternalLink className="w-3 h-3" />
                      </Link>
                      <LessonRowActions lessonId={l.id} isLive={l.isLive} isPublic={l.isPublic} showEdit={false} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* כרטיסים למובייל */}
      <div className="md:hidden space-y-3">
        {lessons.map((l) => {
          const hasRecording =
            !!l.playbackUrl && l.recordingExpiry !== null && l.recordingExpiry > now;
          const daysLeft = hasRecording ? daysUntil(l.recordingExpiry as Date) : 0;
          const streamButNoUrl = !!l.streamId && !l.playbackUrl && !l.recordingUrl;
          return (
            <Card key={l.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bold truncate">{l.title}</div>
                <BroadcastTypeBadge value={(l as any).broadcastType} />
              </div>
              <div className="text-xs text-ink-muted mb-2">
                {formatHebrewDate(l.scheduledAt)}
                {l.durationMin && <> · {l.durationMin} דק׳</>}
                <> · <Eye className="w-3 h-3 inline" /> {l.viewCount}</>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/lesson/${l.id}`} className="text-primary text-xs hover:underline">
                  לשיעור ←
                </Link>
                <MediaLinks lesson={l} />
                {hasRecording && (
                  <a
                    href={l.recordingUrl ?? `/api/lessons/${l.id}/download`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-gold-soft text-gold hover:bg-gold/20 px-2 py-1 rounded-btn transition"
                  >
                    <Download className="w-3.5 h-3.5" /> הורדה · {daysLeft} ימים
                  </a>
                )}
                {streamButNoUrl && (
                  <span className="inline-flex items-center gap-1 text-xs text-gold">
                    <AlertCircle className="w-3.5 h-3.5" /> ההקלטה בעיבוד
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function MediaLinks({ lesson }: { lesson: any }) {
  const links: { href: string; icon: any; label: string; color: string }[] = [];
  if (lesson.youtubeUrl) links.push({ href: lesson.youtubeUrl, icon: Youtube, label: "YouTube", color: "text-danger" });
  if (lesson.spotifyUrl) links.push({ href: lesson.spotifyUrl, icon: Music, label: "Spotify", color: "text-live" });
  if (lesson.applePodcastUrl) links.push({ href: lesson.applePodcastUrl, icon: Music, label: "Apple", color: "text-ink" });
  if (lesson.otherUrl) links.push({ href: lesson.otherUrl, icon: LinkIcon, label: "נוסף", color: "text-primary" });
  if (links.length === 0) return <span className="text-xs text-ink-muted">—</span>;
  return (
    <div className="flex items-center gap-2">
      {links.map((ln, i) => {
        const Icon = ln.icon;
        return (
          <a key={i} href={ln.href} target="_blank" rel="noreferrer" className={`${ln.color} hover:opacity-80`} aria-label={ln.label} title={ln.label}>
            <Icon className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
}
