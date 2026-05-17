// Endpoint לוידוא קוד שידור — לא יוצר שידור, רק בודק תקפות לפני שמציגים את שלב בחירת השיטה.
// משתף את אותו rate limit עם /live-by-code.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { streamCodeMatches, isWithinStreamWindow } from "@/lib/streamCode";

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

const schema = z.object({ code: z.string().min(1).max(40) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const key = rateLimitKey(req, params.id);
  if (!checkRateLimit(key)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: {
      scheduledAt: true, durationMin: true, prepBeforeMin: true,
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
    return NextResponse.json({ error: "לשיעור זה אין קוד שידור" }, { status: 400 });
  }
  if (!streamCodeMatches(lesson.streamCode, parsed.data.code)) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }
  if (!isWithinStreamWindow(lesson.scheduledAt, lesson.durationMin, lesson.prepBeforeMin)) {
    return NextResponse.json({ error: "ניתן לפתוח שידור רק בסמוך לזמן השיעור." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
