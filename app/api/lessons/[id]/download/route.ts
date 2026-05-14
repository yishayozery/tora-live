// Endpoint להורדת ההקלטה (MP4) דרך Cloudflare Stream.
// ציבורי — כל מי שיכול לראות את השיעור יכול גם להוריד עד שתוקף ההקלטה פג.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requestMp4Download } from "@/lib/stream";

// מטמון בזיכרון התהליך — מונע הצפת CF API.
const cache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60_000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      isPublic: true,
      isSuspended: true,
      recordingUrl: true,
      recordingExpiry: true,
      streamId: true,
    },
  });

  if (!lesson || lesson.isSuspended || !lesson.isPublic) {
    return NextResponse.json({ error: "השיעור לא נמצא" }, { status: 404 });
  }
  if (!lesson.recordingUrl || !lesson.recordingExpiry) {
    return NextResponse.json({ error: "אין הקלטה זמינה" }, { status: 404 });
  }
  if (lesson.recordingExpiry.getTime() < Date.now()) {
    return NextResponse.json({ error: "תוקף ההקלטה פג" }, { status: 404 });
  }

  // ה-videoId לצרכי ה-MP4 download — אם יש recordingUrl חוקי משתמשים בו, אחרת fallback ל-streamId.
  const videoId = extractVideoId(lesson.recordingUrl) ?? lesson.streamId;
  if (!videoId) {
    return NextResponse.json({ error: "מזהה ההקלטה חסר" }, { status: 404 });
  }

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ok: true, url: cached.url });
  }

  try {
    const { url, status } = await requestMp4Download(videoId);
    if (status === "inprogress" || !url) {
      return NextResponse.json(
        { error: "הקובץ עדיין בהכנה, נסה שוב בעוד דקה" },
        { status: 425 },
      );
    }
    cache.set(videoId, { url, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[lesson-download] CF error", msg);
    return NextResponse.json({ error: "שגיאה ביצירת קישור הורדה" }, { status: 500 });
  }
}

/** שולף videoId מ-URL של Cloudflare Stream (תבנית `.../<videoId>/manifest/video.m3u8` או דומה). */
function extractVideoId(url: string): string | null {
  const m = url.match(/cloudflarestream\.com\/([a-f0-9]+)\//i);
  return m ? m[1] : null;
}
