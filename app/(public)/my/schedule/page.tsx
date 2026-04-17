import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { Bell, Users, Sparkles } from "lucide-react";
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
        },
        include: { rabbi: true },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      })
    : [];

  // מיזוג כל השיעורים ללוח שבועי
  const allLessons = [
    ...bookmarks.map((b) => ({
      id: b.lesson.id,
      title: b.lesson.title,
      rabbiName: b.lesson.rabbi.name,
      rabbiSlug: b.lesson.rabbi.slug,
      scheduledAt: b.lesson.scheduledAt.toISOString(),
      durationMin: b.lesson.durationMin ?? undefined,
      isLive: b.lesson.isLive,
      broadcastType: b.lesson.broadcastType,
    })),
    ...fromFollowed.map((l) => ({
      id: l.id,
      title: l.title,
      rabbiName: l.rabbi.name,
      rabbiSlug: l.rabbi.slug,
      scheduledAt: l.scheduledAt.toISOString(),
      durationMin: l.durationMin ?? undefined,
      isLive: l.isLive,
      broadcastType: l.broadcastType,
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
    .sort((a, b) => b.rabbi._count.followers - a.rabbi._count.followers)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <h1 className="hebrew-serif text-3xl font-bold">הלוח שלי</h1>

      {/* לוח שבועי */}
      <WeeklyCalendar lessons={allLessons} />

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
                      {new Intl.DateTimeFormat("he-IL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(n.createdAt)}
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
                    {l.rabbi.name} &middot; {formatHebrewDate(l.scheduledAt)} {formatHebrewTime(l.scheduledAt)}
                  </div>
                  <div className="text-xs text-ink-subtle mt-1">
                    {l.rabbi._count.followers} עוקבים
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
