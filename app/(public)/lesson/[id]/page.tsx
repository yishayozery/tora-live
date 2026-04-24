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
  let existingBookmark: { remindBeforeMin: number } | null = null;
  if (session?.user?.id) {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (student) {
      if (student.isBlocked) {
        isChatBlocked = true;
      } else {
        canBookmark = true;
        canSendChat = true;
        existingBookmark = await db.bookmark.findUnique({
          where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
          select: { remindBeforeMin: true },
        });
      }
    }
  }

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
      <div className="mb-2 text-sm">
        {lesson.rabbi ? (
          <Link href={`/rabbi/${lesson.rabbi.slug}`} className="text-primary">
            {lesson.rabbi.name}
          </Link>
        ) : (
          <span className="text-ink-muted">
            מארגן: <span className="text-ink">{lesson.organizerName ?? "—"}</span>
          </span>
        )}
        {lesson.category && <span className="text-ink-muted"> · {lesson.category.name}</span>}
      </div>
      <div className="mt-1 mb-2 flex items-center gap-2">
        <BroadcastTypeBadge value={(lesson as any).broadcastType} />
        {session?.user?.id && !isOwner && (
          <ReportLessonButton lessonId={lesson.id} />
        )}
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
      <h1 className="hebrew-serif text-4xl font-bold text-ink">{lesson.title}</h1>
      <div className="mt-2 text-ink-muted flex items-center gap-3 flex-wrap">
        <span>{formatHebrewDate(lesson.scheduledAt)} · {formatHebrewTime(lesson.scheduledAt)}</span>
        {lesson.durationMin && <span>· {lesson.durationMin} דק׳</span>}
        {lesson.isLive && (
          <span className="inline-flex items-center gap-1 text-live bg-live/10 rounded-full px-2 py-0.5 text-xs">
            <Radio className="w-3 h-3" /> משדר עכשיו
          </span>
        )}
      </div>

      {/* מיקום פיזי */}
      {(lesson as any).locationName && (
        <div className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft bg-paper-warm border border-border-warm px-3 py-1.5 rounded-btn">
          📍 <span>{(lesson as any).locationName}</span>
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

      <div className="mt-5 flex flex-wrap gap-3 items-center">
        <BookmarkButton
          lessonId={lesson.id}
          initialBookmarked={!!existingBookmark}
          initialRemindBefore={existingBookmark?.remindBeforeMin}
          canBookmark={canBookmark}
        />
        {lesson.sourcesPdfUrl && (
          <a
            href={lesson.sourcesPdfUrl}
            target="_blank" rel="noreferrer"
            className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-border bg-white text-ink text-sm"
          >
            <FileText className="w-4 h-4" /> דף מקורות
          </a>
        )}
      </div>

      {/* Share buttons */}
      <div className="mt-4 pt-4 border-t border-border">
        <ShareButtons
          url={`${SITE_URL}/lesson/${lesson.id}`}
          title={lesson.title}
          rabbiName={lesson.rabbi?.name ?? lesson.organizerName ?? undefined}
        />
      </div>

      {/* Video Embed — שידור חי (HLS/YouTube/External) */}
      {lesson.isLive && (lesson.playbackUrl || lesson.liveEmbedUrl) && (
        <div className="mt-8">
          {lesson.liveMethod === "BROWSER" && lesson.playbackUrl ? (
            <div className="rounded-card overflow-hidden border border-live shadow-soft">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={lesson.liveEmbedUrl || lesson.playbackUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          ) : lesson.liveEmbedUrl ? (
            <VideoEmbed url={lesson.liveEmbedUrl} title={lesson.title} />
          ) : null}
        </div>
      )}
      {/* הקלטה זמינה (אחרי שידור מהדפדפן) */}
      {!lesson.isLive && lesson.playbackUrl && lesson.recordingExpiry && new Date(lesson.recordingExpiry) > new Date() && (
        <div className="mt-8">
          <div className="rounded-card border border-gold/30 bg-gold-soft/20 p-4 mb-4 flex items-center justify-between">
            <span className="text-sm text-ink">הקלטת השידור זמינה לצפייה (עד {new Date(lesson.recordingExpiry).toLocaleDateString("he-IL")})</span>
          </div>
          <div className="rounded-card overflow-hidden border border-border shadow-soft">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={lesson.liveEmbedUrl || lesson.playbackUrl}
                title={`${lesson.title} — הקלטה`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
      {/* YouTube embed רגיל (לא שידור חי) */}
      {!lesson.isLive && !lesson.playbackUrl && lesson.youtubeUrl && (
        <div className="mt-8">
          <VideoEmbed url={lesson.youtubeUrl} title={lesson.title} />
        </div>
      )}

      <div className="mt-8 prose prose-slate max-w-none whitespace-pre-line">
        {lesson.description}
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

      {lesson.transcriptText && (
        <Card className="mt-8">
          <h2 className="hebrew-serif text-xl font-bold mb-3">תמלול</h2>
          <div className="whitespace-pre-line text-ink-soft">{lesson.transcriptText}</div>
        </Card>
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
