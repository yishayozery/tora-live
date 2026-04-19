/**
 * Core discovery logic — משותף בין CLI (scripts/lesson-scout.ts) ל-Cron endpoint.
 */
import { db } from "@/lib/db";
import {
  listUpcoming, listLive, listRecent, getVideos,
  parseDurationMin, hasHebrew, guessBroadcastType, isBlockedContent,
  YouTubeQuotaError, YouTubeAuthError, YTVideo,
} from "@/lib/youtube";

export type DiscoveryResult = {
  scannedSources: number;
  newLessons: number;
  updatedLive: number;
  endedBroadcasts: number;
  skippedDuplicates: number;
  skippedFilters: number;
  errors: string[];
  quotaExhausted: boolean;
};

async function getAdminUserId(): Promise<string> {
  const email = process.env.ADMIN_EMAIL || "admin@tora-live.co.il";
  const admin = await db.user.findUnique({ where: { email } });
  if (!admin) throw new Error(`Admin user not found: ${email}`);
  return admin.id;
}

/**
 * סריקת כל המקורות הפעילים ויצירת שיעורים חדשים + עדכון חיים.
 */
export async function runDiscovery(opts: { dryRun?: boolean; channelIdFilter?: string } = {}): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    scannedSources: 0,
    newLessons: 0,
    updatedLive: 0,
    endedBroadcasts: 0,
    skippedDuplicates: 0,
    skippedFilters: 0,
    errors: [],
    quotaExhausted: false,
  };

  const adminId = await getAdminUserId();
  const where: any = { enabled: true };
  if (opts.channelIdFilter) where.channelId = opts.channelIdFilter;
  const sources = await db.rabbiSource.findMany({ where });

  for (const source of sources) {
    if (result.quotaExhausted) break;
    result.scannedSources++;
    try {
      if (source.platform !== "YOUTUBE") continue;

      // 1. גלה videos חדשים (upcoming + live + recent)
      const [upcoming, live, recent] = await Promise.all([
        listUpcoming(source.channelId).catch((e) => { if (e instanceof YouTubeQuotaError) throw e; result.errors.push(`${source.channelTitle}:upcoming:${e.message}`); return []; }),
        listLive(source.channelId).catch((e) => { if (e instanceof YouTubeQuotaError) throw e; return []; }),
        listRecent(source.channelId, 5).catch((e) => { if (e instanceof YouTubeQuotaError) throw e; return []; }),
      ]);
      const allIds = Array.from(new Set([...upcoming, ...live, ...recent]));
      if (allIds.length === 0) continue;

      const videos = await getVideos(allIds);
      const rabbi = source.rabbiId
        ? await db.rabbi.findUnique({ where: { id: source.rabbiId } })
        : null;
      const linkToRabbi = rabbi && rabbi.status === "APPROVED" && !rabbi.isBlocked ? rabbi.id : null;

      for (const v of videos) {
        await processVideo(v, source.id, source.channelTitle, linkToRabbi, adminId, opts.dryRun ?? false, result);
      }

      // 2. עדכן live detection לשיעורים קיימים של המקור (בטווח ±30 דק' סביב scheduledAt)
      if (!opts.dryRun) {
        await detectLiveTransitions(source.id, result);
      }

      if (!opts.dryRun) {
        await db.rabbiSource.update({
          where: { id: source.id },
          data: { lastCheckedAt: new Date(), lastFoundAt: videos.length > 0 ? new Date() : source.lastFoundAt },
        });
      }
    } catch (err: any) {
      if (err instanceof YouTubeQuotaError) {
        result.quotaExhausted = true;
        result.errors.push("QUOTA_EXHAUSTED");
        break;
      }
      if (err instanceof YouTubeAuthError) {
        result.errors.push(`AUTH: ${err.message}`);
        break;
      }
      result.errors.push(`${source.channelTitle}: ${err.message}`);
    }
  }

  return result;
}

async function processVideo(
  v: YTVideo,
  sourceId: string,
  channelTitle: string,
  rabbiId: string | null,
  adminId: string,
  dryRun: boolean,
  result: DiscoveryResult,
) {
  const title = v.snippet.title?.trim();
  const description = (v.snippet.description || "").slice(0, 2000);
  if (!title) { result.skippedFilters++; return; }

  // סנן: לא עברית
  if (!hasHebrew(title)) { result.skippedFilters++; return; }

  // סנן: תוכן פוגעני
  if (isBlockedContent(title, description)) { result.skippedFilters++; return; }

  // סנן: shorts
  const durationMin = parseDurationMin(v.contentDetails.duration || "PT60M");
  if (durationMin < 2) { result.skippedFilters++; return; }

  // קבע scheduledAt
  const live = v.liveStreamingDetails;
  let scheduledAt: Date | null = null;
  if (live?.scheduledStartTime) scheduledAt = new Date(live.scheduledStartTime);
  else if (live?.actualStartTime) scheduledAt = new Date(live.actualStartTime);
  else scheduledAt = new Date(v.snippet.publishedAt);
  if (!scheduledAt || isNaN(scheduledAt.getTime())) { result.skippedFilters++; return; }

  // state
  const isLive = !!(live?.actualStartTime && !live.actualEndTime);
  const hasEnded = !!live?.actualEndTime;
  const broadcastType = guessBroadcastType(title);
  const youtubeUrl = `https://www.youtube.com/watch?v=${v.id}`;
  const embedUrl = `https://www.youtube.com/embed/${v.id}`;

  // duplicate check by externalId
  const existing = await db.lesson.findUnique({ where: { externalId: v.id } });
  if (existing) {
    result.skippedDuplicates++;
    // עדכונים נחוצים: transition ל-live / סיום
    if (!dryRun) {
      const updates: any = {};
      if (isLive && !existing.isLive) { updates.isLive = true; result.updatedLive++; }
      if (hasEnded && existing.isLive) {
        updates.isLive = false;
        updates.playbackUrl = youtubeUrl;
        result.endedBroadcasts++;
      }
      if (Object.keys(updates).length) {
        await db.lesson.update({ where: { id: existing.id }, data: updates });
      }
    }
    return;
  }

  // new lesson
  if (dryRun) { result.newLessons++; return; }

  await db.lesson.create({
    data: {
      title: title.slice(0, 300),
      description: description || title,
      scheduledAt,
      durationMin,
      broadcastType,
      isPublic: true,
      approvalStatus: "PENDING",
      rabbiId: rabbiId,
      organizerUserId: rabbiId ? null : adminId,
      organizerName: rabbiId ? null : channelTitle,
      youtubeUrl,
      liveEmbedUrl: embedUrl,
      isLive,
      externalId: v.id,
      autoDiscovered: true,
      discoveredAt: new Date(),
      sourceId,
    },
  });
  result.newLessons++;
  if (isLive) result.updatedLive++;
}

/**
 * עובר על שיעורים חיים/קרובים שמחוברים למקור — בודק transition של התחלה/סיום.
 * (נקרא בתוך runDiscovery; יכול להיקרא גם מ-cron נפרד להאצה).
 */
export async function detectLiveTransitions(sourceId: string, result: DiscoveryResult) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4h back
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000); // 30m forward

  const candidates = await db.lesson.findMany({
    where: {
      sourceId,
      externalId: { not: null },
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
  });
  if (candidates.length === 0) return;

  const videos = await getVideos(candidates.map((c) => c.externalId!).filter(Boolean));
  const byId = new Map(videos.map((v) => [v.id, v]));

  for (const lesson of candidates) {
    const v = byId.get(lesson.externalId!);
    if (!v) continue;
    const live = v.liveStreamingDetails;
    if (!live) continue;

    const isLiveNow = !!(live.actualStartTime && !live.actualEndTime);
    const hasEnded = !!live.actualEndTime;

    if (isLiveNow && !lesson.isLive) {
      await db.lesson.update({ where: { id: lesson.id }, data: { isLive: true } });
      result.updatedLive++;
    } else if (hasEnded && lesson.isLive) {
      await db.lesson.update({
        where: { id: lesson.id },
        data: { isLive: false, playbackUrl: `https://www.youtube.com/watch?v=${lesson.externalId}` },
      });
      result.endedBroadcasts++;
    }
  }
}
