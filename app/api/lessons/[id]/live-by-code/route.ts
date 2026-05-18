import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { streamCodeMatches, isWithinStreamWindow } from "@/lib/streamCode";
import { createLiveInput, getPlaybackUrl, getEmbedUrl } from "@/lib/stream";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 8;
const WINDOW_SEC = 10 * 60;

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
  const ok = await rateLimit(`live-by-code:${getClientIp(req)}:${params.id}`, MAX_ATTEMPTS, WINDOW_SEC);
  if (!ok) {
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

  // נעילה אטומית למניעת race — שני בקשות מקבילות עם קוד תקין לא ייצרו 2 Cloudflare inputs.
  // updateMany עם תנאי isLive=false: אם count===0 → מישהו אחר כבר התחיל.
  const lock = await db.lesson.updateMany({
    where: { id: params.id, isLive: false, isSuspended: false, isPublic: true },
    data: { isLive: true },
  });
  if (lock.count !== 1) {
    return NextResponse.json({ error: "השידור כבר פעיל" }, { status: 409 });
  }

  // === BROWSER — יוצרים Cloudflare Live Input ומחזירים whipUrl לעוזר ===
  if (parsed.data.liveMethod === "BROWSER") {
    let input;
    try {
      input = await createLiveInput(`${lesson.rabbi?.name ?? "אירוע"} — ${lesson.title} (helper)`);
    } catch (err: any) {
      // ה-lock נכשל ביצירת CF input — מחזירים את ה-flag לאחור כדי שלא נישאר עם isLive=true בלי stream
      await db.lesson.updateMany({ where: { id: params.id, streamId: null }, data: { isLive: false } });
      const msg = err?.message || "";
      let userMsg = `Cloudflare סירב ליצור שידור: ${msg}`;
      if (/subscription/i.test(msg) || /stream.*not.*enabled/i.test(msg)) {
        userMsg = "Cloudflare Stream דורש מנוי בתשלום. פנה לרב/אדמין.";
      }
      return NextResponse.json({ error: userMsg }, { status: 502 });
    }
    const playback = getPlaybackUrl(input.uid);
    const embed = getEmbedUrl(input.uid);

    // isLive כבר true מהנעילה — רק ממלאים את שאר השדות
    await db.lesson.update({
      where: { id: params.id },
      data: {
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

  // === EXTERNAL / YOUTUBE — embed של URL קיים. isLive כבר true מהנעילה ===
  await db.lesson.update({
    where: { id: params.id },
    data: {
      liveMethod: parsed.data.liveMethod,
      liveEmbedUrl: parsed.data.liveEmbedUrl,
      streamId: null,
      playbackUrl: null,
    },
  });

  return NextResponse.json({ ok: true, isLive: true });
}
