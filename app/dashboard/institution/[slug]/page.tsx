import Link from "next/link";
import { requireRakaz } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { RoomCard, type RoomStatus } from "@/components/institution/RoomCard";
import { formatHebrewTime } from "@/lib/utils";
import { Radio, Video, Users, Plus, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 5 * 60_000;

function roomStatus(room: { isBroadcasting: boolean; lastSeenAt: Date | null }): RoomStatus {
  if (room.isBroadcasting) return "live";
  if (room.lastSeenAt && Date.now() - new Date(room.lastSeenAt).getTime() <= ONLINE_WINDOW_MS) {
    return "ready";
  }
  return "offline";
}

export default async function InstitutionDashboardPage({ params }: { params: { slug: string } }) {
  const { institution } = await requireRakaz(params.slug);

  // טווח היום (לפי שעון ישראל מתורגם לזמן השרת)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [rooms, todayLessons] = await Promise.all([
    db.room.findMany({
      where: { institutionId: institution.id },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    db.lesson.findMany({
      where: {
        institutionId: institution.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        rabbi: { select: { name: true } },
        room: { select: { name: true } },
      },
    }),
  ]);

  // כותרות השיעורים הפעילים לכל חדר משדר
  const activeLessonIds = rooms
    .filter((r) => r.isBroadcasting && r.activeLessonId)
    .map((r) => r.activeLessonId as string);
  const activeLessons = activeLessonIds.length
    ? await db.lesson.findMany({
        where: { id: { in: activeLessonIds } },
        select: { id: true, title: true },
      })
    : [];
  const titleByLessonId = new Map(activeLessons.map((l) => [l.id, l.title]));

  return (
    <div className="min-h-screen bg-paper-soft">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* 1. Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span>ניהול מוסד</span>
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-gold/10 text-gold border border-gold/30 text-xs font-semibold">
                רכז
              </span>
            </div>
            <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mt-1">{institution.name}</h1>
            {institution.city && <p className="text-ink-muted mt-1">{institution.city}</p>}
          </div>
        </header>

        {/* 2. Rooms grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-6 h-6 text-primary" />
            <h2 className="hebrew-serif text-2xl font-bold text-ink">חדרי שידור</h2>
            <span className="text-sm text-ink-muted">({rooms.length}/5)</span>
          </div>
          {rooms.length === 0 ? (
            <Card>
              <CardTitle>אין עדיין חדרים</CardTitle>
              <CardDescription>הוסיפו חדר ראשון כדי להתחיל לשדר שיעורים מהמוסד.</CardDescription>
              <Link
                href={`/dashboard/institution/${institution.slug}/rooms/new`}
                className="inline-flex items-center gap-1.5 mt-4 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
              >
                <Plus className="w-4 h-4" /> הוסף חדר
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  slug={institution.slug}
                  room={{
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    isBroadcasting: room.isBroadcasting,
                    rtmpUrl: room.rtmpUrl,
                    streamKey: room.streamKey,
                    playbackUrl: room.playbackUrl,
                  }}
                  status={roomStatus(room)}
                  activeLessonTitle={room.activeLessonId ? titleByLessonId.get(room.activeLessonId) ?? null : null}
                />
              ))}
            </div>
          )}
        </section>

        {/* 3. Today's schedule */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h2 className="hebrew-serif text-2xl font-bold text-ink">לוח השיעורים היום</h2>
          </div>
          {todayLessons.length === 0 ? (
            <Card>
              <CardDescription>אין שיעורים מתוכננים להיום.</CardDescription>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden divide-y divide-border">
              {todayLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-paper-soft transition"
                >
                  <span className="hebrew-serif text-lg font-bold text-primary tabular-nums w-14 shrink-0">
                    {formatHebrewTime(lesson.scheduledAt)}
                  </span>
                  <span className="text-sm text-ink-soft border-r border-border pr-3 sm:pr-4 w-32 sm:w-40 shrink-0 truncate">
                    {lesson.room?.name ?? "—"}
                  </span>
                  <span className="text-sm text-ink-muted hidden sm:block w-32 shrink-0 truncate">
                    {lesson.rabbi?.name ?? lesson.organizerName ?? "—"}
                  </span>
                  <span className="text-sm font-medium text-ink min-w-0 flex-1 truncate">{lesson.title}</span>
                </Link>
              ))}
            </Card>
          )}
        </section>

        {/* 4. Quick actions */}
        <section>
          <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4">פעולות מהירות</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={`/dashboard/institution/${institution.slug}/rooms/new`}
              className="flex items-center gap-3 rounded-card border border-border bg-white p-4 hover:border-primary hover:shadow-card transition"
            >
              <Plus className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-ink">הוסף חדר</span>
            </Link>
            <Link
              href={`/dashboard/institution/${institution.slug}/members`}
              className="flex items-center gap-3 rounded-card border border-border bg-white p-4 hover:border-primary hover:shadow-card transition"
            >
              <Users className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-ink">נהל חברים</span>
            </Link>
            <Link
              href="/dashboard/lessons/new"
              className="flex items-center gap-3 rounded-card border border-border bg-white p-4 hover:border-primary hover:shadow-card transition"
            >
              <Video className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-ink">הוסף שיעור</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
