import Link from "next/link";
import { requireRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  Eye,
  Users,
  ArrowLeft,
  Clock,
} from "lucide-react";

/** סוגי שידור שנחשבים "אירוע אישי" (לא שיעור רגיל) */
const EVENT_BROADCAST_TYPES = new Set([
  "WEDDING",
  "BAR_MITZVAH",
  "HESPED",
  "EVENT",
  "NIGGUN",
  "CHAZANUT",
]);

function isWithinBroadcastWindow(scheduledAt: Date): boolean {
  const now = Date.now();
  const t = scheduledAt.getTime();
  const THIRTY_MIN = 30 * 60 * 1000;
  return Math.abs(t - now) <= THIRTY_MIN;
}

export default async function RabbiDashboardPage() {
  const { rabbi } = await requireRabbi();

  if (rabbi.status === "PENDING") {
    return (
      <Card className="max-w-2xl">
        <CardTitle>החשבון שלך ממתין לאישור</CardTitle>
        <CardDescription>
          אדמין יקבל התראה ויבדוק את בקשתך. כשהחשבון יאושר, תקבל התראה במייל ותוכל להתחיל להעלות שיעורים.
        </CardDescription>
      </Card>
    );
  }

  if (rabbi.status === "REJECTED") {
    return (
      <Card className="max-w-2xl">
        <CardTitle>הבקשה נדחתה</CardTitle>
        <CardDescription>לפרטים נוספים צור קשר עם האדמין.</CardDescription>
      </Card>
    );
  }

  // חלון 4 שבועות: מתחילת החודש הנוכחי ועד סוף 6 שבועות קדימה — קצת יותר כדי לכסות ניווט
  const now = new Date();
  const calFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const calTo = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeLessonsCount,
    pendingRequestsCount,
    viewsLast30,
    followersCount,
    calendarLessons,
    pendingRequests,
  ] = await Promise.all([
    db.lesson.count({ where: { rabbiId: rabbi.id, scheduledAt: { gte: now } } }),
    db.contactRequest.count({ where: { rabbiId: rabbi.id, status: "PENDING" } }),
    db.lesson.aggregate({
      where: { rabbiId: rabbi.id, scheduledAt: { gte: thirtyDaysAgo, lte: now } },
      _sum: { viewCount: true },
    }),
    db.follow.count({ where: { rabbiId: rabbi.id } }),
    db.lesson.findMany({
      where: {
        rabbiId: rabbi.id,
        scheduledAt: { gte: calFrom, lte: calTo },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    db.contactRequest.findMany({
      where: { rabbiId: rabbi.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { student: { select: { name: true } } },
    }),
  ]);

  // אירועים מבוססי פניות שאושרו — סימון ויזואלי סגול.
  const approvedRequests = await db.contactRequest.findMany({
    where: {
      rabbiId: rabbi.id,
      status: "APPROVED",
      requestedDate: { gte: calFrom, lte: calTo },
    },
    include: { student: { select: { name: true } } },
  });

  const calendarItems = [
    ...calendarLessons.map((l) => {
      const isEvent = EVENT_BROADCAST_TYPES.has((l as any).broadcastType ?? "LESSON");
      const isPrivate = (l as any).isPublic === false;
      const variant: "live" | "event" | "lesson" | "private" = l.isLive
        ? "live"
        : isPrivate
          ? "private"
          : isEvent
            ? "event"
            : "lesson";
      return {
        id: l.id,
        title: (isPrivate ? "🔒 " : "") + l.title,
        rabbiName: rabbi.name,
        rabbiSlug: rabbi.slug,
        scheduledAt: l.scheduledAt.toISOString(),
        durationMin: l.durationMin ?? undefined,
        isLive: l.isLive,
        broadcastType: (l as any).broadcastType ?? "LESSON",
        variant,
        href: `/dashboard/lessons/${l.id}`,
        canStartBroadcast: !l.isLive && isWithinBroadcastWindow(l.scheduledAt),
      };
    }),
    ...approvedRequests
      .filter((r) => r.requestedDate)
      .map((r) => ({
        id: `req-${r.id}`,
        title: r.topic || "פנייה שאושרה",
        rabbiName: r.student.name,
        rabbiSlug: rabbi.slug,
        scheduledAt: (r.requestedDate as Date).toISOString(),
        variant: "approvedRequest" as const,
        href: `/dashboard/requests`,
      })),
  ];

  const profileIncomplete = !rabbi.profileCompleted || (rabbi.bio?.length ?? 0) < 20;
  const totalViews30 = viewsLast30._sum.viewCount ?? 0;

  return (
    <div className="space-y-8">
      {profileIncomplete && (
        <Link
          href="/dashboard/settings"
          className="block rounded-card border border-gold/30 bg-gold-soft/60 p-5 hover:shadow-soft transition"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-ink">השלם את הפרופיל שלך</div>
              <p className="text-sm text-ink-soft mt-1">
                הוסף תיאור, קישורים למדיה (YouTube, Spotify…) ותמונה. זה יגדיל משמעותית את כמות הצופים שלך.
              </p>
            </div>
            <span className="text-primary text-sm font-semibold shrink-0">השלם ←</span>
          </div>
        </Link>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="hebrew-serif text-3xl font-bold">שלום {rabbi.name}</h1>
          <p className="text-sm text-ink-muted mt-1">
            דף הבית שלך — לוח שנה, שיעורים ופניות במקום אחד.
          </p>
        </div>
        <Link
          href="/dashboard/lessons/new"
          className="h-11 px-5 inline-flex items-center rounded-btn bg-primary text-white hover:bg-primary-hover"
        >
          + שיעור / אירוע חדש
        </Link>
      </div>

      {/* סקציה עליונה — כרטיסי סטטיסטיקה */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-ink-muted">שיעורים פעילים</div>
            <div className="text-2xl font-bold mt-0.5">
              {activeLessonsCount.toLocaleString("he-IL")}
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-soft text-gold flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-ink-muted">פניות ממתינות</div>
            <div className="text-2xl font-bold mt-0.5">
              {pendingRequestsCount.toLocaleString("he-IL")}
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-live/10 text-live flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-ink-muted">צפיות ב-30 יום</div>
            <div className="text-2xl font-bold mt-0.5">
              {totalViews30.toLocaleString("he-IL")}
            </div>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-ink-muted">עוקבים</div>
            <div className="text-2xl font-bold mt-0.5">
              {followersCount.toLocaleString("he-IL")}
            </div>
          </div>
        </Card>
      </div>

      {/* סקציה ראשית — לוח שנה */}
      <section>
        <WeeklyCalendar lessons={calendarItems} title="לוח שנה — שיעורים ואירועים" compact />
        {/* מקרא */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
          <LegendDot color="bg-primary-soft border-primary/20" label="שיעור" />
          <LegendDot color="bg-live/10 border-live/30" label="שידור חי" />
          <LegendDot color="bg-gold-soft border-gold/30" label="אירוע אישי" />
          <LegendDot color="bg-purple-100 border-purple-300" label="פנייה שאושרה" />
        </div>
      </section>

      {/* סקציה תחתונה — פניות ממתינות */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="hebrew-serif text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-gold" /> פניות ממתינות
          </h2>
          <Link
            href="/dashboard/requests"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            לכל הפניות <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardDescription>אין פניות ממתינות כרגע.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <Card key={r.id} className="border-gold/20">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{r.student.name}</div>
                    {r.topic && (
                      <div className="text-sm text-ink-soft mt-0.5 truncate">{r.topic}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-muted shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
                      day: "numeric",
                      month: "long",
                    }).format(r.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-ink-soft line-clamp-2">{r.message}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-full border ${color}`} />
      {label}
    </span>
  );
}
