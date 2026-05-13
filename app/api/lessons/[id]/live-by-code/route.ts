import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { streamCodeMatches, isWithinStreamWindow } from "@/lib/streamCode";

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

const schema = z.object({
  code: z.string().min(3).max(40),
  liveMethod: z.enum(["YOUTUBE", "EXTERNAL"]),
  liveEmbedUrl: z.string().url(),
});

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
    select: {
      id: true, scheduledAt: true, durationMin: true,
      streamCode: true, isLive: true, isSuspended: true, isPublic: true,
    },
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
  if (!isWithinStreamWindow(lesson.scheduledAt, lesson.durationMin)) {
    return NextResponse.json({ error: "ניתן לפתוח שידור רק בסמוך לזמן השיעור (±שעה)." }, { status: 403 });
  }
  if (!streamCodeMatches(lesson.streamCode, parsed.data.code)) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

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
