import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { ShareButtons } from "@/components/ShareButtons";
import { LessonStructuredData } from "@/components/LessonStructuredData";
import type { Metadata } from "next";

const SITE_URL = "https://tora-live.co.il";

// === SEO + Open Graph + JSON-LD ===
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    include: { rabbi: { select: { name: true } } },
  });
  if (!lesson) return { title: "שיעור לא נמצא | TORA_LIVE" };
  const rabbiName = lesson.rabbi?.name ?? lesson.organizerName ?? "שיעור תורה";
  const fullTitle = `${lesson.title} — הרב ${rabbiName} | TORA_LIVE`;
  const title = fullTitle.length > 65 ? `${lesson.title} | TORA_LIVE`.slice(0, 65) : fullTitle;
  const shortDesc = (lesson.description ?? "").trim().slice(0, 80);
  const description = `האזינו לשיעור "${lesson.title}" מאת הרב ${rabbiName}. ${shortDesc || "שיעור תורה בחינם"}`.slice(0, 160);
  const url = `${SITE_URL}/lesson/${lesson.id}`;
  const image = lesson.posterUrl || `${SITE_URL}/og-default.png`;
  return {
    title, description,
    alternates: {
      canonical: url,
      languages: {
        he: url,
        en: `${SITE_URL}/en/lesson/${lesson.id}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: lesson.isLive ? "video.other" : "article",
      images: [{ url: image, width: 1200, height: 630, alt: lesson.title }],
      locale: "he_IL", siteName: "TORA_LIVE",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
import { BookmarkButton } from "@/components/BookmarkButton";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { LivePdfViewer } from "@/components/LivePdfViewer";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { LessonChat } from "@/components/LessonChat";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ReportLessonButton } from "@/components/ReportLessonButton";
import { Radio, FileText, AlertTriangle } from "lucide-react";
import { StartLiveByCode } from "@/components/StartLiveByCode";
import { StartLiveAsHelper } from "@/components/StartLiveAsHelper";
import { isWithinStreamWindow } from "@/lib/streamCode";
import { HeroBlock } from "@/components/lesson/HeroBlock";
import { LessonRabbiCard } from "@/components/lesson/RabbiCard";
import { GuestCTA } from "@/components/lesson/GuestCTA";
import { RelatedLessons } from "@/components/lesson/RelatedLessons";

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    include: {
      rabbi: true,
      category: true,
      sources: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!lesson) notFound();
  // אם יש רב — חייב להיות APPROVED ולא חסום. אירועים ללא רב מותרים.
  if (lesson.rabbi && (lesson.rabbi.status !== "APPROVED" || lesson.rabbi.isBlocked)) notFound();

  const session = await getServerSession(authOptions);

  // האם המשתמש הנוכחי הוא הבעלים (רב או מארגן)
  let isOwner = false;
  if (session?.user?.id) {
    if (lesson.organizerUserId === session.user.id) isOwner = true;
    if (!isOwner && lesson.rabbiId) {
      const ownerRabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
      if (ownerRabbi && ownerRabbi.id === lesson.rabbiId) isOwner = true;
    }
  }

  // אירוע פרטי — מוצג רק לבעלים
  if (!(lesson as any).isPublic && !isOwner) notFound();

  // אירוע ממתין לאישור / נדחה — מוצג רק לבעלים
  if (lesson.approvalStatus !== "APPROVED" && !isOwner) notFound();

  // === View counter — fire-and-forget. רק למבקר אמיתי שלא הבעלים. ===
  if (!isOwner && lesson.approvalStatus === "APPROVED" && lesson.isPublic) {
    db.lesson.update({
      where: { id: lesson.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
  }

  // שיעור מושהה — מוצג לבעלים, לציבור מוצגת הודעה
  const isSuspendedForViewer = lesson.isSuspended && !isOwner;
  let canBookmark = false;
  let canSendChat = false;
  let isChatBlocked = false;
  let isStreamHelper = false; // המשתמש הנוכחי הוא עוזר שידור של הרב
  let isFollowingRabbi = false;
  let canFollow = false;
  let existingBookmark: { remindBeforeMin: number } | null = null;
  if (session?.user?.id) {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (student) {
      if (student.isBlocked) {
        isChatBlocked = true;
      } else {
        canBookmark = true;
        canSendChat = true;
        canFollow = true;
        existingBookmark = await db.bookmark.findUnique({
          where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
          select: { remindBeforeMin: true },
        });
        // בדיקה אם המשתמש סומן כעוזר שידור של הרב של השיעור + מצב follow
        if (lesson.rabbiId) {
          const follow = await db.follow.findUnique({
            where: { studentId_rabbiId: { studentId: student.id, rabbiId: lesson.rabbiId } },
            select: { isStreamHelper: true } as any,
          });
          isFollowingRabbi = !!follow;
          isStreamHelper = !!(follow && (follow as any).isStreamHelper);
        }
      }
    }
  }

  // שיעורים קרובים נוספים של אותו רב — לדחיפת engagement
  const relatedLessons = lesson.rabbiId && !isSuspendedForViewer
    ? await db.lesson.findMany({
        where: {
          rabbiId: lesson.rabbiId,
          scheduledAt: { gte: new Date() },
          id: { not: lesson.id },
          isPublic: true,
          approvalStatus: "APPROVED",
          isSuspended: false,
        },
        orderBy: { scheduledAt: "asc" },
        take: 6,
        select: { id: true, title: true, scheduledAt: true, isLive: true },
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {lesson.approvalStatus === "PENDING" && isOwner && (
        <div className="mb-4 rounded-btn bg-gold-soft border border-gold/30 text-gold px-4 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          האירוע ממתין לאישור האדמין. רק אתה רואה אותו כרגע.
        </div>
      )}
      {lesson.isSuspended && isOwner && (
        <div className="mb-4 rounded-btn bg-danger/10 border border-danger/30 text-danger px-4 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          שיעור זה הושהה עקב דיווחים. הציבור לא רואה אותו.
        </div>
      )}
      {isSuspendedForViewer ? (
        <Card className="mt-6 border-danger/30 bg-danger/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
            <div>
              <h1 className="hebrew-serif text-2xl font-bold text-ink mb-2">
                שיעור זה הושהה זמנית
              </h1>
              <p className="text-ink-soft">
                השיעור הושהה זמנית עקב דיווחים. האדמין יבדוק את הנושא בהקדם.
              </p>
            </div>
          </div>
        </Card>
      ) : (
      <>
      <div className="mb-3 text-sm flex items-center gap-2 flex-wrap">
        {!lesson.rabbi && (
          <span className="text-ink-muted">
            מארגן: <span className="text-ink">{lesson.organizerName ?? "—"}</span>
          </span>
        )}
        {lesson.category && <span className="text-ink-muted">{lesson.category.name}</span>}
        {/* סוג שידור מוצג רק לבעלים (פנימי, לא מעניין לצופה) */}
        {isOwner && <BroadcastTypeBadge value={(lesson as any).broadcastType} />}
      </div>
      <LessonStructuredData lesson={lesson as any} />
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "בית", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "שיעורים", item: `${SITE_URL}/lessons` },
              ...(lesson.rabbi
                ? [
                    {
                      "@type": "ListItem",
                      position: 3,
                      name: `הרב ${lesson.rabbi.name}`,
                      item: `${SITE_URL}/rabbi/${lesson.rabbi.slug}`,
                    },
                    { "@type": "ListItem", position: 4, name: lesson.title },
                  ]
                : [{ "@type": "ListItem", position: 3, name: lesson.title }]),
            ],
          }),
        }}
      />
      {/* HERO — תצוגה מותאמת לפי מצב (LIVE/EXTERNAL/UPCOMING/ENDED_REC) */}
      <HeroBlock lesson={lesson as any} rabbi={lesson.rabbi} />

      {/* כותרת + מטא */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,280px]">
        <div className="min-w-0">
          <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">{lesson.title}</h1>
          <div className="mt-2 text-ink-muted flex items-center gap-3 flex-wrap text-sm">
            <span>{formatHebrewDate(lesson.scheduledAt)} · {formatHebrewTime(lesson.scheduledAt)}</span>
            {lesson.durationMin && <span>· {lesson.durationMin} דק׳</span>}
          </div>

          {/* מיקום פיזי */}
          {(lesson as any).locationName && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft bg-paper-warm border border-border-warm px-3 py-1.5 rounded-btn">
              <span aria-hidden>📍</span>
              <span>{(lesson as any).locationName}</span>
              {(lesson as any).locationUrl && (
                <a
                  href={(lesson as any).locationUrl}
                  target="_blank" rel="noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  במפה ←
                </a>
              )}
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <BookmarkButton
              lessonId={lesson.id}
              initialBookmarked={!!existingBookmark}
              initialRemindBefore={existingBookmark?.remindBeforeMin}
              canBookmark={canBookmark}
            />
            {!isOwner && !lesson.isLive && isWithinStreamWindow(lesson.scheduledAt, lesson.durationMin, (lesson as any).prepBeforeMin) && (
              <>
                {isStreamHelper ? (
                  <StartLiveAsHelper lessonId={lesson.id} lessonTitle={lesson.title} />
                ) : (
                  (lesson as any).streamCode && <StartLiveByCode lessonId={lesson.id} lessonTitle={lesson.title} />
                )}
              </>
            )}
          </div>

          {/* CTA לאורחים — בנה לוח לימוד אישי */}
          {!session?.user?.id && !isOwner && (
            <div className="mt-5">
              <GuestCTA lessonId={lesson.id} />
            </div>
          )}

          {/* Share buttons */}
          <div className="mt-4 pt-4 border-t border-border">
            <ShareButtons
              url={`${SITE_URL}/lesson/${lesson.id}`}
              title={lesson.title}
              rabbiName={lesson.rabbi?.name ?? lesson.organizerName ?? undefined}
            />
          </div>

          {/* תיאור השיעור */}
          {lesson.description && (
            <div className="mt-8 prose prose-slate max-w-none whitespace-pre-line">
              {lesson.description}
            </div>
          )}
        </div>

        {/* SIDEBAR — כרטיס רב (במובייל נופל למטה) */}
        {lesson.rabbi && (
          <div className="lg:sticky lg:top-4 self-start">
            <LessonRabbiCard
              rabbi={lesson.rabbi}
              upcomingCount={relatedLessons.length}
              isFollowing={isFollowingRabbi}
              canFollow={canFollow}
            />
          </div>
        )}
      </div>

      {(lesson.youtubeUrl || lesson.spotifyUrl || lesson.applePodcastUrl || lesson.otherUrl) && (
        <div className="mt-8">
          <h2 className="hebrew-serif text-xl font-bold mb-3">האזנה / צפייה</h2>
          <div className="flex flex-wrap gap-2">
            {lesson.youtubeUrl && <LinkBtn href={lesson.youtubeUrl}>YouTube</LinkBtn>}
            {lesson.spotifyUrl && <LinkBtn href={lesson.spotifyUrl}>Spotify</LinkBtn>}
            {lesson.applePodcastUrl && <LinkBtn href={lesson.applePodcastUrl}>Apple Podcasts</LinkBtn>}
            {lesson.otherUrl && <LinkBtn href={lesson.otherUrl}>קישור נוסף</LinkBtn>}
          </div>
        </div>
      )}

      <LessonChat lessonId={lesson.id} canSend={canSendChat} isBlocked={isChatBlocked} />

      {lesson.sources.map((s) => (
        <LivePdfViewer
          key={s.id}
          lessonId={lesson.id}
          sourceId={s.id}
          fileUrl={s.fileUrl}
          fileName={s.fileName}
          initialPage={s.currentPage}
          totalPages={s.totalPages}
          initialLive={s.isLiveFollow}
        />
      ))}

      {/* דף מקורות חיצוני (אם אין כבר LivePdfViewer מקוון) */}
      {lesson.sourcesPdfUrl && lesson.sources.length === 0 && (
        <div className="mt-6">
          <a
            href={lesson.sourcesPdfUrl}
            target="_blank" rel="noreferrer"
            className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-border bg-white text-ink text-sm hover:bg-paper-soft"
          >
            <FileText className="w-4 h-4" /> דף מקורות
          </a>
        </div>
      )}

      {lesson.transcriptText && (
        <Card className="mt-8">
          <h2 className="hebrew-serif text-xl font-bold mb-3">תמלול</h2>
          <div className="whitespace-pre-line text-ink-soft">{lesson.transcriptText}</div>
        </Card>
      )}

      {/* שיעורים קרובים נוספים של הרב */}
      {lesson.rabbi && relatedLessons.length > 0 && (
        <RelatedLessons
          rabbiName={lesson.rabbi.name}
          rabbiSlug={lesson.rabbi.slug}
          lessons={relatedLessons}
        />
      )}

      {/* דיווח (דיסקרטי, רק לתלמיד מחובר) */}
      {session?.user?.id && !isOwner && (
        <div className="mt-10 pt-6 border-t border-border flex justify-end">
          <ReportLessonButton lessonId={lesson.id} />
        </div>
      )}
      </>
      )}
    </div>
  );
}

function LinkBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      className="h-10 px-4 inline-flex items-center rounded-btn border border-border bg-white hover:bg-paper-soft text-sm"
    >
      {children}
    </a>
  );
}
