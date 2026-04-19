/**
 * YouTube Data API v3 — wrapper לצרכי lesson-scout.
 *
 * דורש YOUTUBE_API_KEY ב-env. להקמה: ראה YOUTUBE_SETUP.md.
 * Quota: 10,000 units/day (חינם). search.list=100, videos.list=1 per batch.
 */

const BASE = "https://www.googleapis.com/youtube/v3";

type YTSearchItem = {
  id: { videoId?: string; kind: string };
  snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string; description: string };
};

type YTVideo = {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { default?: { url: string }; high?: { url: string }; standard?: { url: string } };
    liveBroadcastContent?: "none" | "upcoming" | "live";
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
  };
  contentDetails: {
    duration: string; // ISO 8601: "PT1H30M"
  };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    concurrentViewers?: string;
  };
};

export class YouTubeQuotaError extends Error {}
export class YouTubeAuthError extends Error {}

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new YouTubeAuthError("YOUTUBE_API_KEY חסר ב-env. ראה YOUTUBE_SETUP.md");
  return key;
}

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey());
  const res = await fetch(url.toString());
  if (res.status === 403) {
    const body = await res.text();
    if (body.includes("quotaExceeded")) throw new YouTubeQuotaError("YouTube API quota exceeded");
    throw new YouTubeAuthError(`YouTube 403: ${body.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`YouTube ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** upcoming live streams לערוץ (עולה 100 units) */
export async function listUpcoming(channelId: string, maxResults = 25): Promise<string[]> {
  const data = await yt<{ items: YTSearchItem[] }>("/search", {
    part: "snippet",
    channelId,
    eventType: "upcoming",
    type: "video",
    maxResults: String(maxResults),
    order: "date",
  });
  return data.items.map((i) => i.id.videoId).filter(Boolean) as string[];
}

/** currently live streams (100 units) */
export async function listLive(channelId: string, maxResults = 5): Promise<string[]> {
  const data = await yt<{ items: YTSearchItem[] }>("/search", {
    part: "snippet",
    channelId,
    eventType: "live",
    type: "video",
    maxResults: String(maxResults),
  });
  return data.items.map((i) => i.id.videoId).filter(Boolean) as string[];
}

/** Recent uploads — completed videos (100 units, but limited by search filtering) */
export async function listRecent(channelId: string, maxResults = 10): Promise<string[]> {
  const data = await yt<{ items: YTSearchItem[] }>("/search", {
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: String(maxResults),
  });
  return data.items.map((i) => i.id.videoId).filter(Boolean) as string[];
}

/**
 * Recent uploads via uploads playlist — מחזיר את *כל* ההעלאות (לא מסונן ע"י search).
 * עולה רק 1 unit (במקום 100). הדרך המומלצת.
 */
export async function listUploadsViaPlaylist(channelId: string, maxResults = 50): Promise<string[]> {
  // Channel ID UC... → uploads playlist UU...
  if (!channelId.startsWith("UC")) throw new Error(`Invalid channelId: ${channelId}`);
  const uploadsPlaylistId = "UU" + channelId.slice(2);
  const data = await yt<{ items: { snippet: { resourceId: { videoId: string } } }[] }>("/playlistItems", {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: String(Math.min(maxResults, 50)),
  });
  return data.items.map((i) => i.snippet.resourceId.videoId).filter(Boolean);
}

/** פרטים מלאים ל-up to 50 videos (1 unit total) */
export async function getVideos(videoIds: string[]): Promise<YTVideo[]> {
  if (videoIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));
  const all: YTVideo[] = [];
  for (const chunk of chunks) {
    const data = await yt<{ items: YTVideo[] }>("/videos", {
      part: "snippet,contentDetails,liveStreamingDetails",
      id: chunk.join(","),
      maxResults: "50",
    });
    all.push(...data.items);
  }
  return all;
}

/** המרת ISO 8601 duration ל-דקות. "PT1H30M15S" → 90 */
export function parseDurationMin(iso: string): number {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 60;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return Math.max(1, h * 60 + min + Math.round(s / 60));
}

/** האם הכותרת בעברית */
export function hasHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/** זיהוי broadcastType לפי הכותרת */
export function guessBroadcastType(title: string): "LESSON" | "PRAYER" | "OTHER" {
  const t = title.toLowerCase();
  if (/(תפיל|שחרית|מנחה|ערבית|סליחות|מעריב|ימים נוראים|קבלת שבת)/.test(t)) return "PRAYER";
  if (/(שיעור|פרש|גמר|דף יומי|משנה|הלכ|מוסר|חסידו|תני|מחשב)/.test(t)) return "LESSON";
  return "OTHER";
}

/** מילים אסורות — דגלים לתוכן פוגעני/פוליטי קיצוני */
const BANNED_KEYWORDS: string[] = [
  // להוסיף לפי הצורך — עדיף להשאיר קצר, לסנן ידנית בתחילה
];

export function isBlockedContent(title: string, description: string): boolean {
  const combined = `${title} ${description}`.toLowerCase();
  return BANNED_KEYWORDS.some((kw) => combined.includes(kw));
}

export type { YTVideo };
