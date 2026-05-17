import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { streamCodeMatches, isWithinStreamWindow } from "@/lib/streamCode";
import { createLiveInput, getPlaybackUrl, getEmbedUrl } from "@/lib/stream";

// rate-limit in-memory (per process). מספיק לעצירת brute-force ביעד מקומי;
// בפרודקשן מומלץ Upstash/Redis — נוסיף בעתיד אם צריך.
const attempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60_000;

function rateLimitKey(req: Request, lessonId: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  return `${ip}:${lessonId}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return true;
  }
  rec.count += 1;
  return rec.count <= MAX_ATTEMPTS;
}

// השדה liveEmbedUrl חובה רק ב-EXTERNAL/YOUTUBE; ב-BROWSER הוא נוצר אוטומטית מ-Cloudflare.
const schema = z.object({
  code: z.string().min(3).max(40),
  liveMethod: z.enum(["BROWSER", "YOUTUBE", "EXTERNAL"]),
  liveEmbedUrl: z.string().url().optional(),
}).refine(
  (d) => d.liveMethod === "BROWSER" || (d.liveEmbedUrl && d.liveEmbedUrl.length > 0),
  { message: "חסר קישור לשידור החי", path: ["liveEmbedUrl"] },
);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const key = rateLimitKey(req, params.id);
  if (!checkRateLimit(key)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    include: { rabbi: { select: { name: true } } },
  });
  if (!lesson || lesson.isSuspended || !lesson.isPublic) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }
  if (lesson.isLive) {
    return NextResponse.json({ error: "השידור כבר פעיל" }, { status: 409 });
  }
  if (!lesson.streamCode) {
    return NextResponse.json({ error: "לשיעור זה אין קוד שידור. הרב צריך לפתוח את השידור מהדשבורד." }, { status: 400 });
  }
  if (!isWithinStreamWindow(lesson.scheduledAt, lesson.durationMin, lesson.prepBeforeMin)) {
    return NextResponse.json({ error: "ניתן לפתוח שידור רק בסמוך לזמן השיעור." }, { status: 403 });
  }
  if (!streamCodeMatches(lesson.streamCode, parsed.data.code)) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

  // === BROWSER — יוצרים Cloudflare Live Input ומחזירים whipUrl לעוזר ===
  if (parsed.data.liveMethod === "BROWSER") {
    let input;
    try {
      input = await createLiveInput(`${lesson.rabbi?.name ?? "אירוע"} — ${lesson.title} (helper)`);
    } catch (err: any) {
      const msg = err?.message || "";
      let userMsg = `Cloudflare סירב ליצור שידור: ${msg}`;
      if (/subscription/i.test(msg) || /stream.*not.*enabled/i.test(msg)) {
        userMsg = "Cloudflare Stream דורש מנוי בתשלום. פנה לרב/אדמין.";
      }
      return NextResponse.json({ error: userMsg }, { status: 502 });
    }
    const playback = getPlaybackUrl(input.uid);
    const embed = getEmbedUrl(input.uid);

    await db.lesson.update({
      where: { id: params.id },
      data: {
        isLive: true,
        liveMethod: "BROWSER",
        streamId: input.uid,
        playbackUrl: playback,
        liveEmbedUrl: embed || null,
      },
    });

    return NextResponse.json({
      ok: true,
      isLive: true,
      method: "BROWSER",
      streamId: input.uid,
      whipUrl: input.webRTC.url,
      playbackUrl: playback,
    });
  }

  // === EXTERNAL / YOUTUBE — embed של URL קיים ===
  await db.lesson.update({
    where: { id: params.id },
    data: {
      isLive: true,
      liveMethod: parsed.data.liveMethod,
      liveEmbedUrl: parsed.data.liveEmbedUrl,
      streamId: null,
      playbackUrl: null,
    },
  });

  return NextResponse.json({ ok: true, isLive: true });
}
