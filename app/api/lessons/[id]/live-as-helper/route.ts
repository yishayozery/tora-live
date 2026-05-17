import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isWithinStreamWindow } from "@/lib/streamCode";

// POST /api/lessons/[id]/live-as-helper
// Used by a student marked as `Follow.isStreamHelper` for the rabbi who owns the lesson.
// Authentication: must be logged in as a student + must be helper of the lesson's rabbi.
const schema = z.object({
  liveMethod: z.enum(["YOUTUBE", "EXTERNAL"]),
  liveEmbedUrl: z.string().url(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true, rabbiId: true,
      scheduledAt: true, durationMin: true, prepBeforeMin: true,
      isLive: true, isSuspended: true, isPublic: true,
    },
  });
  if (!lesson || lesson.isSuspended || !lesson.isPublic || !lesson.rabbiId) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }
  if (lesson.isLive) {
    return NextResponse.json({ error: "השידור כבר פעיל" }, { status: 409 });
  }

  // לאמת שהמשתמש הוא תלמיד מסומן כעוזר של הרב הזה
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isBlocked: true },
  });
  if (!student || student.isBlocked) {
    return NextResponse.json({ error: "חשבון לא תקין" }, { status: 403 });
  }
  const follow = await db.follow.findUnique({
    where: { studentId_rabbiId: { studentId: student.id, rabbiId: lesson.rabbiId } },
    select: { isStreamHelper: true },
  });
  if (!follow || !(follow as any).isStreamHelper) {
    return NextResponse.json({ error: "אינך מוגדר כעוזר שידור של הרב" }, { status: 403 });
  }

  if (!isWithinStreamWindow(lesson.scheduledAt, lesson.durationMin, lesson.prepBeforeMin)) {
    return NextResponse.json({ error: "ניתן לפתוח שידור רק בסמוך לזמן השיעור." }, { status: 403 });
  }

  // נעילה אטומית — שני עוזרים שלחצו במקביל לא יציגו שני שידורים סותרים
  const lock = await db.lesson.updateMany({
    where: { id: params.id, isLive: false },
    data: { isLive: true },
  });
  if (lock.count !== 1) {
    return NextResponse.json({ error: "השידור כבר פעיל" }, { status: 409 });
  }

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
