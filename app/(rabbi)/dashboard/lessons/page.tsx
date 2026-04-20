import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { LessonsTabs } from "@/components/LessonsTabs";
import { formatHebrewDate } from "@/lib/utils";
import { BookOpen, Eye, Youtube, Music, Link as LinkIcon, ExternalLink, Download } from "lucide-react";
import { LessonRowActions } from "@/components/rabbi/LessonRowActions";

function daysUntil(date: Date): number {
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default async function LessonsPage() {
  const { rabbi } = await requireApprovedRabbi();
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.lesson.findMany({
      where: { rabbiId: rabbi.id, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      include: { category: true },
    }),
    db.lesson.findMany({
      where: { rabbiId: rabbi.id, scheduledAt: { lt: now } },
      orderBy: { scheduledAt: "desc" },
      include: { category: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" /> השיעורים שלי
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            ניהול שיעורים קרובים והיסטוריית שיעורים שמסרת.
          </p>
        </div>
        <Link
          href="/dashboard/lessons/new"
          className="h-11 px-5 inline-flex items-center rounded-btn bg-primary text-white hover:bg-primary-hover"
        >
          + שיעור / אירוע חדש
        </Link>
      </div>

      <LessonsTabs
        upcomingCount={upcoming.length}
        pastCount={past.length}
        upcoming={<UpcomingList lessons={upcoming} />}
        past={<PastList lessons={past} now={now} />}
      />
    </div>
  );
}

/* ============== טאב 1: קרובים ============== */
function UpcomingList({ lessons }: { lessons: any[] }) {
  if (lessons.length === 0) {
    return (
      <Card>
        <CardDescription>
          עוד אין שיעורים מתוכננים. לחץ על "שיעור / אירוע חדש" כדי להתחיל.
        </CardDescription>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {lessons.map((l) => (
        <Card key={l.id}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-bold truncate">{l.title}</div>
                <BroadcastTypeBadge value={(l as any).broadcastType} />
              </div>
              <div className="text-sm text-ink-muted">
                {formatHebrewDate(l.scheduledAt)}
                {l.category && <> · {l.category.name}</>}
                <> · {l.viewCount.toLocaleString("he-IL")} צפיות</>
                {l.isLive && <span className="text-live"> · משדר עכשיו</span>}
              </div>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              <Link href={`/lesson/${l.id}`} className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-xs">
                <ExternalLink className="w-3 h-3" /> תצוגה
              </Link>
              <LessonRowActions lessonId={l.id} isLive={l.isLive} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============== טאב 2: שיעורים שמסרתי (היה archive) ============== */
function PastList({ lessons, now }: { lessons: any[]; now: Date }) {
  if (lessons.length === 0) {
    return (
      <Card>
        <CardDescription>
          עדיין לא מסרת שיעורים. שיעורים שתאריכם חלף יופיעו כאן עם קישורי המדיה וההקלטות.
        </CardDescription>
      </Card>
    );
  }

  return (
    <>
      {/* טבלה לדסקטופ */}
      <div className="hidden md:block overflow-x-auto">
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
                      <a
                        href={l.recordingUrl ?? l.playbackUrl ?? "#"}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-gold-soft text-gold hover:bg-gold/20 px-2 py-1 rounded-btn transition"
                        title={`תפוג בעוד ${daysLeft} ימים`}
                      >
                        <Download className="w-3.5 h-3.5" /> הורדה
                        <span className="text-[10px] opacity-75">({daysLeft}ד׳)</span>
                      </a>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link href={`/lesson/${l.id}`} className="text-primary text-xs hover:underline inline-flex items-center gap-1">
                        לשיעור <ExternalLink className="w-3 h-3" />
                      </Link>
                      <LessonRowActions lessonId={l.id} isLive={l.isLive} showEdit={false} />
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
          return (
            <Card key={l.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bold truncate">{l.title}</div>
                <BroadcastTypeBadge value={(l as any).broadcastType} />
              </div>
              <div className="text-xs text-ink-muted mb-2">
                {formatHebrewDate(l.scheduledAt)}
                {l.durationMin && <> · {l.durationMin} דק׳</>}
                <> · </>
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {l.viewCount.toLocaleString("he-IL")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <MediaLinks lesson={l} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Link href={`/lesson/${l.id}`} className="text-primary text-sm inline-flex items-center gap-1 hover:underline">
                  לשיעור <ExternalLink className="w-3 h-3" />
                </Link>
                {hasRecording && (
                  <a
                    href={l.recordingUrl ?? l.playbackUrl ?? "#"}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-gold-soft text-gold hover:bg-gold/20 px-2 py-1 rounded-btn transition"
                  >
                    <Download className="w-3.5 h-3.5" /> הורדה · {daysLeft} ימים
                  </a>
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
