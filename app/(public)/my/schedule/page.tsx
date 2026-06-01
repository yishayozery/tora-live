import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatHebrewDate, formatHebrewTime, formatHebrewDateLetters } from "@/lib/utils";
import { Bell, Users, Sparkles } from "lucide-react";

// בונה לינק WhatsApp עם רשימת השיעורים שהתלמיד סימן (כולל קישורים)
function buildStudentWaShare(lessons: Array<{ id: string; title: string; scheduledAt: string; rabbiName: string }>): string {
  const sorted = [...lessons].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const lines = [
    "📚 השיעורים שלי ב-TANA:",
    "",
    ...sorted.map((l) => {
      const d = new Date(l.scheduledAt);
      const date = d.toLocaleDateString("he-IL");
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return `📅 ${date} ${time} — ${l.title} (${l.rabbiName})\nhttps://tora-live-rho.vercel.app/lesson/${l.id}\n`;
    }),
  ];
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { MarkAllRead } from "@/components/MarkAllRead";
import { cn } from "@/lib/utils";
import { FollowButtonInline } from "@/components/FollowButtonInline";

export default async function SchedulePage() {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return null;

  const now = new Date();

  // 1. Bookmarks — שיעורים שסימנתי
  const bookmarks = await db.bookmark.findMany({
    where: { studentId: student.id, lesson: { scheduledAt: { gte: now } } },
    include: { lesson: { include: { rabbi: true } } },
    orderBy: { lesson: { scheduledAt: "asc" } },
  });

  // 2. שיעורים של רבנים שעוקב (לא bookmarked)
  const followedRabbis = await db.follow.findMany({
    where: { studentId: student.id },
    select: { rabbiId: true },
  });
  const followedIds = followedRabbis.map((f) => f.rabbiId);
  const bookmarkedIds = new Set(bookmarks.map((b) => b.lessonId));
  const fromFollowed = followedIds.length
    ? await db.lesson.findMany({
        where: {
          rabbiId: { in: followedIds },
          scheduledAt: { gte: now },
          id: { notIn: Array.from(bookmarkedIds) },
          isPublic: true,
          approvalStatus: "APPROVED",
          isSuspended: false,
        },
        include: { rabbi: true },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      })
    : [];

  // מיזוג כל השיעורים ללוח שבועי. שיעורים שכבר ב-bookmarks → bookmarked=true.
  const allLessons = [
    ...bookmarks.map((b) => ({
      id: b.lesson.id,
      title: b.lesson.title,
      rabbiName: b.lesson.rabbi?.name ?? (b.lesson as any).organizerName ?? "אירוע",
      rabbiSlug: b.lesson.rabbi?.slug ?? "",
      scheduledAt: b.lesson.scheduledAt.toISOString(),
      durationMin: b.lesson.durationMin ?? undefined,
      isLive: b.lesson.isLive,
      broadcastType: b.lesson.broadcastType,
      bookmarked: true,
    })),
    ...fromFollowed.map((l) => ({
      id: l.id,
      title: l.title,
      rabbiName: l.rabbi?.name ?? (l as any).organizerName ?? "אירוע",
      rabbiSlug: l.rabbi?.slug ?? "",
      scheduledAt: l.scheduledAt.toISOString(),
      durationMin: l.durationMin ?? undefined,
      isLive: l.isLive,
      broadcastType: l.broadcastType,
      bookmarked: false, // עוקב, אבל לא סימן ספציפית
    })),
  ];

  // 3. התראות אחרונות (5)
  const notifications = await db.notification.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 4. רבנים חדשים — approved, לא blocked, לא עוקב
  const newRabbis = await db.rabbi.findMany({
    where: {
      status: "APPROVED",
      isBlocked: false,
      id: { notIn: followedIds },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { _count: { select: { followers: true, lessons: true } } },
  });

  // 5. המלצות — שיעורים עתידיים מרבנים פופולריים שלא עוקב ולא bookmark
  const recommendedLessons = await db.lesson.findMany({
    where: {
      scheduledAt: { gte: now },
      rabbiId: { notIn: followedIds },
      id: { notIn: Array.from(bookmarkedIds) },
      isPublic: true,
      approvalStatus: "APPROVED",
      isSuspended: false,
      rabbi: { status: "APPROVED", isBlocked: false },
    },
    include: {
      rabbi: {
        include: { _count: { select: { followers: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  // מיון לפי פופולריות הרב ולקיחת 3
  const topRecommended = recommendedLessons
    .filter((l) => l.rabbi)
    .sort((a, b) => (b.rabbi?._count.followers ?? 0) - (a.rabbi?._count.followers ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero אישי — קטן, צבעוני, מציב את התלמיד במרכז */}
      <div className="rounded-card bg-gradient-to-l from-primary/10 via-gold/10 to-paper-warm border border-gold/30 p-4 sm:p-5 shadow-soft">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-white flex items-center justify-center hebrew-serif text-2xl shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="hebrew-serif text-xl sm:text-2xl font-bold text-ink">
              שלום, {student.name}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {allLessons.length > 0
                ? `${allLessons.length} שיעורים בלוח שלך`
                : "הוסף שיעורים ללוח שלך ע״י סימון מתוך עמוד הרב"}
            </p>
          </div>
          {allLessons.length > 0 && (
            <a
              href={buildStudentWaShare(allLessons)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-btn border border-[#25D366]/40 bg-[#25D366]/10 text-[#1E8E47] text-sm font-semibold hover:bg-[#25D366]/20"
              title="שלח לי את הלוח שלי ב-WhatsApp"
            >
              💬 שלח את הלוח שלי
            </a>
          )}
        </div>
      </div>

      {/* לוח שבועי */}
      <WeeklyCalendar lessons={allLessons} canBookmark={!student.isBlocked} />

      {/* התראות אחרונות */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="hebrew-serif text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            התראות אחרונות
          </h2>
          <MarkAllRead />
        </div>
        {notifications.length === 0 ? (
          <Card>
            <CardDescription>אין התראות חדשות.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link key={n.id} href={n.link}>
                <Card
                  className={cn(
                    "transition hover:border-primary/30",
                    !n.readAt && "border-r-4 border-r-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{n.title}</div>
                      <div className="text-xs text-ink-muted mt-0.5">{n.body}</div>
                    </div>
                    <div className="text-xs text-ink-subtle shrink-0">
                      {formatHebrewDateLetters(n.createdAt, false)} · {new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(n.createdAt)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* רבנים חדשים */}
      {newRabbis.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="hebrew-serif text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              רבנים חדשים
            </h2>
            <Link href="/my/rabbis" className="text-sm text-primary hover:underline">
              גלה עוד רבנים &larr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {newRabbis.map((r) => (
              <Card key={r.id} className="flex flex-col justify-between">
                <div>
                  <Link href={`/rabbi/${r.slug}`} className="font-bold text-ink hover:text-primary transition">
                    {r.name}
                  </Link>
                  <div className="text-xs text-ink-muted line-clamp-2 mt-1">{r.bio}</div>
                  <div className="text-xs text-ink-subtle mt-2">
                    {r._count.lessons} שיעורים
                  </div>
                </div>
                <div className="mt-3">
                  <FollowButtonInline rabbiId={r.id} initialFollowing={false} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* המלצות */}
      {topRecommended.length > 0 && (
        <section>
          <h2 className="hebrew-serif text-xl font-bold flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-gold" />
            המלצות עבורך
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {topRecommended.map((l) => (
              <Link key={l.id} href={`/lesson/${l.id}`}>
                <Card className="hover:border-primary/30 transition h-full">
                  <div className="font-bold text-sm truncate">{l.title}</div>
                  <div className="text-xs text-ink-muted mt-1">
                    {l.rabbi?.name ?? "אירוע"} &middot; {formatHebrewDate(l.scheduledAt)} {formatHebrewTime(l.scheduledAt)}
                  </div>
                  <div className="text-xs text-ink-subtle mt-1">
                    {l.rabbi?._count.followers ?? 0} עוקבים
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
