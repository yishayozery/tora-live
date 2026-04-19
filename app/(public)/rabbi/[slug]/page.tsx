import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { FollowButton } from "@/components/FollowButton";
import { ContactRabbiButton } from "@/components/ContactRabbiButton";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import {
  Calendar,
  Radio,
  FileText,
  Youtube,
  Music,
  Globe,
  Facebook,
  Link as LinkIcon,
  Eye,
  History,
} from "lucide-react";

const MEDIA_META: Record<string, { label: string; icon: typeof Youtube }> = {
  youtube: { label: "YouTube", icon: Youtube },
  spotify: { label: "Spotify", icon: Music },
  applePodcast: { label: "Apple Podcasts", icon: Music },
  soundcloud: { label: "SoundCloud", icon: Music },
  facebook: { label: "Facebook", icon: Facebook },
  website: { label: "אתר אישי", icon: Globe },
  other: { label: "קישור נוסף", icon: LinkIcon },
};

const PAGE_SIZE = 12;

// ISR — דף רב מתעדכן כל 5 דקות (תוכן יציב יחסית)
export const revalidate = 300;

export default async function RabbiPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { page?: string };
}) {
  const now = new Date();
  const currentPage = Math.max(1, parseInt(searchParams?.page || "1", 10));

  const rabbi = await db.rabbi.findUnique({
    where: { slug: params.slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      lessons: {
        where: { isPublic: true, approvalStatus: "APPROVED", isSuspended: false },
        orderBy: { scheduledAt: "desc" },
        include: {
          category: true,
          sources: { select: { id: true }, take: 1 },
        },
      },
      _count: { select: { followers: true } },
    },
  });

  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) notFound();

  // --- session / follow / contact ---
  const session = await getServerSession(authOptions);
  let canFollow = false;
  let isFollowing = false;
  let canContact = false;
  let isContactBlocked = false;
  if (session?.user?.id) {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
    });
    if (student) {
      if (student.isBlocked) {
        isContactBlocked = true;
      } else {
        canFollow = true;
        canContact = true;
        const f = await db.follow.findUnique({
          where: {
            studentId_rabbiId: { studentId: student.id, rabbiId: rabbi.id },
          },
        });
        isFollowing = !!f;
      }
    }
  }

  // --- media links ---
  let mediaLinks: Record<string, string> = {};
  try {
    if (rabbi.mediaLinks) mediaLinks = JSON.parse(rabbi.mediaLinks);
  } catch {}
  const mediaEntries = Object.entries(mediaLinks).filter(([, v]) => v);

  // --- split lessons ---
  const upcomingLessons = rabbi.lessons
    .filter((l) => new Date(l.scheduledAt) >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

  const pastLessons = rabbi.lessons
    .filter((l) => new Date(l.scheduledAt) < now)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  // --- stats ---
  const totalLessons = rabbi.lessons.length;
  const totalViews = rabbi.lessons.reduce((s, l) => s + l.viewCount, 0);
  const totalHours =
    rabbi.lessons.reduce((s, l) => s + (l.durationMin ?? 0), 0) / 60;

  // --- group past lessons by category ---
  const categoriesWithPast = rabbi.categories
    .map((cat) => ({
      ...cat,
      lessons: pastLessons.filter((l) => l.categoryId === cat.id),
    }))
    .filter((cat) => cat.lessons.length > 0);

  const uncategorizedPast = pastLessons.filter((l) => !l.categoryId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        {rabbi.photoUrl ? (
          rabbi.photoUrl.startsWith("data:") ? (
            // base64 — next/image לא תומך, נשאיר native
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rabbi.photoUrl} alt={rabbi.name} className="w-32 h-32 rounded-full object-cover border-4 border-gold-soft" />
          ) : (
            <Image
              src={rabbi.photoUrl}
              alt={rabbi.name}
              width={128}
              height={128}
              className="w-32 h-32 rounded-full object-cover border-4 border-gold-soft"
              priority
            />
          )
        ) : (
          <div className="w-32 h-32 rounded-full bg-primary-soft flex items-center justify-center hebrew-serif text-4xl text-primary">
            {rabbi.name.charAt(0)}
          </div>
        )}
        <div className="text-center sm:text-right flex-1">
          <h1 className="hebrew-serif text-4xl font-bold text-ink">
            {rabbi.name}
          </h1>

          {rabbi.bio && rabbi.bio.trim() !== "" && (
            <p className="text-ink-soft mt-2 max-w-2xl whitespace-pre-line">
              {rabbi.bio}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <FollowButton
              rabbiId={rabbi.id}
              initialFollowing={isFollowing}
              canFollow={canFollow}
            />
            <ContactRabbiButton
              rabbiId={rabbi.id}
              canSend={canContact}
              isBlocked={isContactBlocked}
            />
            <span className="text-sm text-ink-muted">
              {rabbi._count.followers.toLocaleString("he-IL")} עוקבים
            </span>
          </div>

          {mediaEntries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              {mediaEntries.map(([key, url]) => {
                const meta = MEDIA_META[key] ?? {
                  label: key,
                  icon: LinkIcon,
                };
                const Icon = meta.icon;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-white text-xs text-ink-soft hover:border-primary hover:text-primary transition"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Mini dashboard ===== */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">
            {totalHours.toFixed(0)}
          </div>
          <div className="text-xs text-ink-muted">שעות שיעור</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">{totalLessons}</div>
          <div className="text-xs text-ink-muted">שיעורים</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">
            {totalViews.toLocaleString("he-IL")}
          </div>
          <div className="text-xs text-ink-muted">צפיות</div>
        </Card>
      </div>

      {/* ===== Upcoming lessons ===== */}
      <section className="mb-10">
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" /> שיעורים מתוכננים
        </h2>
        {upcomingLessons.length === 0 ? (
          <Card>
            <CardDescription>אין שיעורים מתוכננים כעת.</CardDescription>
          </Card>
        ) : (
          <div className="grid gap-3">
            {upcomingLessons.map((l) => (
              <Link key={l.id} href={`/lesson/${l.id}`} className="block">
                <Card className="hover:border-primary/40 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{l.title}</CardTitle>
                      <div className="text-sm text-ink-muted mt-1">
                        {formatHebrewDate(l.scheduledAt)} ·{" "}
                        {formatHebrewTime(l.scheduledAt)}
                      </div>
                      {l.category && (
                        <span className="text-xs text-ink-subtle mt-1 inline-block">
                          {l.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <BroadcastTypeBadge value={l.broadcastType} />
                      {l.isLive && (
                        <span className="text-xs bg-live/10 text-live px-2 py-1 rounded-full flex items-center gap-1">
                          <Radio className="w-3 h-3" /> שידור חי
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== Past lessons (history) ===== */}
      <section className="mb-10">
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> היסטוריית שיעורים
        </h2>

        {pastLessons.length === 0 ? (
          <Card>
            <CardDescription>עדיין אין שיעורים שהתקיימו.</CardDescription>
          </Card>
        ) : (() => {
          // Pagination על pastLessons (כולם — categorized + uncategorized יחד)
          const totalPages = Math.ceil(pastLessons.length / PAGE_SIZE);
          const safePage = Math.min(currentPage, totalPages);
          const startIdx = (safePage - 1) * PAGE_SIZE;
          const pageLessons = pastLessons.slice(startIdx, startIdx + PAGE_SIZE);
          const pageLessonIds = new Set(pageLessons.map(l => l.id));

          // קטגוריות בעמוד הזה
          const catsInPage = categoriesWithPast
            .map(cat => ({ ...cat, lessons: cat.lessons.filter(l => pageLessonIds.has(l.id)) }))
            .filter(c => c.lessons.length > 0);
          const uncatInPage = uncategorizedPast.filter(l => pageLessonIds.has(l.id));

          return (
            <>
              <div className="mb-3 text-sm text-ink-muted">
                מציג {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, pastLessons.length)} מתוך {pastLessons.length} שיעורים
              </div>

              {catsInPage.map((cat) => (
                <div key={cat.id} className="mb-8">
                  <h3 className="hebrew-serif text-xl font-bold text-ink mb-3">{cat.name}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cat.lessons.map((l) => (
                      <PastLessonCard key={l.id} lesson={l} />
                    ))}
                  </div>
                </div>
              ))}

              {uncatInPage.length > 0 && (
                <div className="mb-8">
                  {catsInPage.length > 0 && (
                    <h3 className="hebrew-serif text-xl font-bold text-ink mb-3">כללי</h3>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {uncatInPage.map((l) => (
                      <PastLessonCard key={l.id} lesson={l} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="ניווט בין עמודים">
                  <Link
                    href={safePage > 1 ? `?page=${safePage - 1}` : "#"}
                    aria-disabled={safePage === 1}
                    className={`min-w-[44px] h-11 px-4 inline-flex items-center justify-center rounded-btn border text-sm font-medium ${
                      safePage === 1
                        ? "border-border text-ink-muted bg-paper-soft cursor-not-allowed pointer-events-none"
                        : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                    }`}
                  >
                    הבא →
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-muted px-1">…</span>}
                        <Link
                          href={`?page=${p}`}
                          className={`min-w-[44px] h-11 px-3 inline-flex items-center justify-center rounded-btn border text-sm font-medium transition ${
                            p === safePage
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                          }`}
                          aria-current={p === safePage ? "page" : undefined}
                        >
                          {p}
                        </Link>
                      </span>
                    ))}
                  <Link
                    href={safePage < totalPages ? `?page=${safePage + 1}` : "#"}
                    aria-disabled={safePage === totalPages}
                    className={`min-w-[44px] h-11 px-4 inline-flex items-center justify-center rounded-btn border text-sm font-medium ${
                      safePage === totalPages
                        ? "border-border text-ink-muted bg-paper-soft cursor-not-allowed pointer-events-none"
                        : "border-border bg-white text-ink hover:border-primary hover:text-primary"
                    }`}
                  >
                    ← הקודם
                  </Link>
                </nav>
              )}
            </>
          );
        })()}
      </section>

      {/* ===== Contact / request ===== */}
      <section className="text-center py-8 border-t border-border">
        <h2 className="hebrew-serif text-2xl font-bold text-ink mb-3">
          רוצה לבקש שיעור או ליצור קשר?
        </h2>
        <ContactRabbiButton
          rabbiId={rabbi.id}
          canSend={canContact}
          isBlocked={isContactBlocked}
        />
      </section>
    </div>
  );
}

/* ---------- Past lesson card ---------- */

type PastLesson = {
  id: string;
  title: string;
  scheduledAt: Date;
  viewCount: number;
  broadcastType: string;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  applePodcastUrl: string | null;
  soundcloudUrl: string | null;
  otherUrl: string | null;
  sourcesPdfUrl: string | null;
  sources: { id: string }[];
  description: string;
  posterUrl?: string | null;
};

function PastLessonCard({ lesson: l }: { lesson: PastLesson }) {
  const hasSourcesPage = l.sourcesPdfUrl || l.sources.length > 0;

  const mediaLinks: { href: string; label: string; Icon: typeof Youtube }[] =
    [];
  if (l.youtubeUrl)
    mediaLinks.push({ href: l.youtubeUrl, label: "YouTube", Icon: Youtube });
  if (l.spotifyUrl)
    mediaLinks.push({ href: l.spotifyUrl, label: "Spotify", Icon: Music });
  if (l.applePodcastUrl)
    mediaLinks.push({
      href: l.applePodcastUrl,
      label: "Apple Podcasts",
      Icon: Music,
    });
  if (l.soundcloudUrl)
    mediaLinks.push({
      href: l.soundcloudUrl,
      label: "SoundCloud",
      Icon: Music,
    });
  if (l.otherUrl)
    mediaLinks.push({ href: l.otherUrl, label: "קישור", Icon: LinkIcon });

  const poster = (l as any).posterUrl as string | null | undefined;
  return (
    <Card className="overflow-hidden p-0">
      {poster && (
        <Link href={`/lesson/${l.id}`} className="block relative h-32 w-full overflow-hidden bg-paper-soft">
          <Image
            src={poster}
            alt={l.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover hover:scale-105 transition"
          />
        </Link>
      )}
      <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/lesson/${l.id}`} className="hover:text-primary transition">
            <CardTitle>{l.title}</CardTitle>
          </Link>
          <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>{formatHebrewDate(l.scheduledAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {l.viewCount.toLocaleString("he-IL")}
            </span>
          </div>
        </div>
        <BroadcastTypeBadge value={l.broadcastType} />
      </div>

      {(mediaLinks.length > 0 || hasSourcesPage) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mediaLinks.map((m) => (
            <a
              key={m.href}
              href={m.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <m.Icon className="w-3.5 h-3.5" />
              {m.label}
            </a>
          ))}
          {hasSourcesPage && (
            <Link
              href={`/lesson/${l.id}#sources`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              דף מקורות
            </Link>
          )}
        </div>
      )}
      </div>
    </Card>
  );
}
