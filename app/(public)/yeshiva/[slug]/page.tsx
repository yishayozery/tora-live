import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { formatHebrewTime, pluralize } from "@/lib/utils";
import { Radio, Calendar, MapPin, Mail, Phone, Users } from "lucide-react";

export const revalidate = 60;

const SITE = "https://tora-live.co.il";

// === SEO + Open Graph ===
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const institution = await db.institution.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, logoUrl: true, city: true, isActive: true },
  });
  if (!institution || !institution.isActive) {
    return { title: "ישיבה לא נמצאה | TANA" };
  }

  const shortDesc = (institution.description ?? "").trim().slice(0, 80);
  const title = `ישיבת ${institution.name} | TANA`.slice(0, 70);
  const description = `שיעורי תורה בשידור חי מישיבת ${institution.name}${institution.city ? ` ב${institution.city}` : ""}. ${shortDesc || "צפו בשיעורים מכל חדרי בית המדרש."}`.slice(0, 160);
  const url = `${SITE}/yeshiva/${params.slug}`;
  const image = institution.logoUrl || `${SITE}/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image, alt: `ישיבת ${institution.name}` }],
      locale: "he_IL",
      siteName: "TANA",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function YeshivaPublicPage({ params }: { params: { slug: string } }) {
  // ---- שלב 1: שליפת המוסד עצמו (לוודא שהוא פעיל) ----
  const institution = await db.institution.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      address: true,
      city: true,
      logoUrl: true,
      contactEmail: true,
      contactPhone: true,
      isActive: true,
    },
  });

  if (!institution || !institution.isActive) {
    notFound();
  }

  // ---- שלב 2: טווח היום (לפי שעון ישראל מתורגם לזמן השרת) ----
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  // ---- שלב 3: כל השאילתות במקביל ----
  // אבטחה: שדות החדר select מפורש — לעולם לא streamKey/rtmpUrl/deviceToken.
  // אבטחה: שדות חברי המוסד — לא email/phone של רבנים.
  const [rooms, todayLessons, members, monthlyLessonsCount] = await Promise.all([
    db.room.findMany({
      where: { institutionId: institution.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        isBroadcasting: true,
        playbackUrl: true,
        activeLessonId: true,
        lastSeenAt: true,
      },
    }),
    db.lesson.findMany({
      where: {
        institutionId: institution.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        broadcastType: true,
        organizerName: true,
        rabbi: { select: { name: true, slug: true } },
        room: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    db.institutionMember.findMany({
      where: {
        institutionId: institution.id,
        role: { in: ["RABBI", "RAKAZ"] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            rabbi: {
              select: { name: true, slug: true, photoUrl: true, status: true, isBlocked: true },
            },
            student: {
              select: { name: true },
            },
          },
        },
      },
    }),
    db.lesson.count({
      where: {
        institutionId: institution.id,
        scheduledAt: { gte: startOfMonth, lt: endOfMonth },
        isPublic: true,
        approvalStatus: "APPROVED",
        isSuspended: false,
      },
    }),
  ]);

  // ---- שלב 4: שליפת השיעורים הפעילים לחדרים שמשדרים ----
  const activeLessonIds = rooms
    .filter((r) => r.isBroadcasting && r.activeLessonId)
    .map((r) => r.activeLessonId as string);

  const activeLessons = activeLessonIds.length
    ? await db.lesson.findMany({
        where: { id: { in: activeLessonIds } },
        select: { id: true, title: true },
      })
    : [];
  const activeLessonById = new Map(activeLessons.map((l) => [l.id, l]));

  const broadcastingRooms = rooms.filter((r) => r.isBroadcasting && r.playbackUrl);
  const liveCount = broadcastingRooms.length;

  return (
    <div className="min-h-screen bg-paper-soft">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10 sm:space-y-12">
        {/* === 1. Hero === */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center h-7 px-3 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              ישיבה ב-TANA
            </span>
            {liveCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-live/10 text-live border border-live/30 text-xs font-semibold">
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-live animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-live" />
                </span>
                {pluralize(liveCount, "שידור חי עכשיו", "שידורים חיים עכשיו")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-ink-muted/10 text-ink-muted border border-border text-xs font-semibold">
                <Radio className="w-3 h-3" />
                אין שידור חי כרגע
              </span>
            )}
          </div>

          <div className="flex items-start gap-4">
            {institution.logoUrl && (
              <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-card overflow-hidden border border-border bg-white">
                <Image
                  src={institution.logoUrl}
                  alt={`לוגו ${institution.name}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="hebrew-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight">
                {institution.name}
              </h1>
              {institution.city && (
                <p className="text-ink-muted mt-1 text-sm sm:text-base">{institution.city}</p>
              )}
            </div>
          </div>

          {institution.description && (
            <p className="text-ink-soft text-base sm:text-lg leading-relaxed max-w-3xl whitespace-pre-line">
              {institution.description}
            </p>
          )}
        </header>

        {/* === 2. Rooms grid — live broadcasts === */}
        {broadcastingRooms.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-6 h-6 text-live" />
              <h2 className="hebrew-serif text-2xl font-bold text-ink">שידורים חיים עכשיו</h2>
              <span className="text-sm text-ink-muted">({broadcastingRooms.length})</span>
            </div>

            <div
              className={
                broadcastingRooms.length === 1
                  ? "grid gap-4"
                  : "grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              }
            >
              {broadcastingRooms.map((room) => {
                const activeLesson = room.activeLessonId
                  ? activeLessonById.get(room.activeLessonId)
                  : null;

                const InnerCard = (
                  <Card className="p-0 overflow-hidden hover:border-primary/40 transition">
                    <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                      {/* iframe חי — Cloudflare Stream. autoplay+muted מאפשרים נגינה אוטומטית במובייל. */}
                      <iframe
                        src={`${room.playbackUrl}?autoplay=true&muted=true&preload=auto&letterboxColor=transparent`}
                        title={`${institution.name} — ${room.name}`}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        className="absolute inset-0 w-full h-full"
                      />
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-live text-white text-xs font-bold shadow-soft">
                        <span className="relative inline-flex w-1.5 h-1.5">
                          <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-white" />
                        </span>
                        LIVE
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="font-semibold text-ink">{room.name}</div>
                      {activeLesson ? (
                        <div className="text-sm text-ink-soft truncate">{activeLesson.title}</div>
                      ) : room.description ? (
                        <div className="text-sm text-ink-muted truncate">{room.description}</div>
                      ) : null}
                    </div>
                  </Card>
                );

                return activeLesson ? (
                  <Link
                    key={room.id}
                    href={`/lesson/${activeLesson.id}`}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card"
                    aria-label={`צפה בשיעור ${activeLesson.title} מחדר ${room.name}`}
                  >
                    {InnerCard}
                  </Link>
                ) : (
                  <div key={room.id}>{InnerCard}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* === 3. Today's schedule === */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="hebrew-serif text-2xl font-bold text-ink">לוח שיעורי היום</h2>
            {todayLessons.length > 0 && (
              <span className="text-sm text-ink-muted">({todayLessons.length})</span>
            )}
          </div>

          {todayLessons.length === 0 ? (
            <Card>
              <CardDescription>אין שיעורים מתוכננים להיום.</CardDescription>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden divide-y divide-border">
              {todayLessons.map((lesson) => {
                const rabbiName = lesson.rabbi?.name ?? lesson.organizerName ?? "—";
                return (
                  <Link
                    key={lesson.id}
                    href={`/lesson/${lesson.id}`}
                    className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-paper-soft transition focus:outline-none focus-visible:bg-paper-soft"
                  >
                    <span className="hebrew-serif text-lg font-bold text-primary tabular-nums w-14 shrink-0">
                      {formatHebrewTime(lesson.scheduledAt)}
                    </span>
                    <span className="text-sm text-ink-soft border-r border-border pr-3 sm:pr-4 w-28 sm:w-40 shrink-0 truncate">
                      {lesson.room?.name ?? "—"}
                    </span>
                    <span className="text-sm text-ink-muted hidden sm:block w-32 shrink-0 truncate">
                      {rabbiName}
                    </span>
                    <span className="text-sm font-medium text-ink min-w-0 flex-1 truncate">
                      {lesson.title}
                    </span>
                    {lesson.category?.name && (
                      <span className="hidden md:inline-flex items-center h-6 px-2 rounded-full bg-gold/10 text-gold border border-gold/30 text-xs font-semibold shrink-0">
                        {lesson.category.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </Card>
          )}
        </section>

        {/* === 4. Rabbis at this yeshiva === */}
        {members.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="hebrew-serif text-2xl font-bold text-ink">הרבנים בישיבה</h2>
              <span className="text-sm text-ink-muted">({members.length})</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => {
                const rabbi = member.user.rabbi;
                const displayName =
                  rabbi?.name ?? member.user.student?.name ?? "—";
                const hasPublicPage =
                  rabbi?.slug && rabbi.status === "APPROVED" && !rabbi.isBlocked;

                const Inner = (
                  <div className="flex items-center gap-3 rounded-card border border-border bg-white p-3 hover:border-primary/40 hover:shadow-card transition">
                    <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden bg-paper-soft border border-border">
                      {rabbi?.photoUrl ? (
                        <Image
                          src={rabbi.photoUrl}
                          alt={`תמונת ${displayName}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-muted">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">{displayName}</div>
                      <div className="text-xs text-ink-muted">
                        {member.role === "RAKAZ" ? "רכז" : "רב"}
                      </div>
                    </div>
                  </div>
                );

                return hasPublicPage ? (
                  <Link
                    key={member.id}
                    href={`/rabbi/${rabbi!.slug}`}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card"
                  >
                    {Inner}
                  </Link>
                ) : (
                  <div key={member.id}>{Inner}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* === 5. About + contact + stats === */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 space-y-3">
            <CardTitle>אודות ויצירת קשר</CardTitle>
            {(institution.address || institution.city) && (
              <div className="flex items-start gap-2 text-sm text-ink-soft">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>
                  {[institution.address, institution.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {institution.contactEmail && (
              <a
                href={`mailto:${institution.contactEmail}`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus-visible:underline"
              >
                <Mail className="w-4 h-4" />
                {institution.contactEmail}
              </a>
            )}
            {institution.contactPhone && (
              <a
                href={`tel:${institution.contactPhone}`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus-visible:underline ms-4"
              >
                <Phone className="w-4 h-4" />
                {institution.contactPhone}
              </a>
            )}
            {!institution.address &&
              !institution.contactEmail &&
              !institution.contactPhone && (
                <CardDescription>אין פרטי התקשרות זמינים כרגע.</CardDescription>
              )}
          </Card>

          <Card className="flex flex-col justify-center text-center">
            <div className="hebrew-serif text-4xl font-bold text-primary">
              {monthlyLessonsCount.toLocaleString("he-IL")}
            </div>
            <CardDescription className="mt-1">
              {pluralize(monthlyLessonsCount, "שיעור החודש", "שיעורים החודש")}
            </CardDescription>
          </Card>
        </section>
      </main>
    </div>
  );
}
