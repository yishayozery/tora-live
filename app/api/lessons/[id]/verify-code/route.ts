// Endpoint לוידוא קוד שידור — לא יוצר שידור, רק בודק תקפות לפני שמציגים את שלב בחירת השיטה.
// משתף את אותו rate limit עם /live-by-code.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { streamCodeMatches, isWithinStreamWindow } from "@/lib/streamCode";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 8;
const WINDOW_SEC = 10 * 60;

const schema = z.object({ code: z.string().min(1).max(40) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // משתף קונטקסט rate-limit עם /live-by-code (אותו prefix) — מי שמנסה לנחש לא יכול לעקוף ע״י שינוי endpoint
  const ok = await rateLimit(`live-by-code:${getClientIp(req)}:${params.id}`, MAX_ATTEMPTS, WINDOW_SEC);
  if (!ok) {
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
