import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST — רב מסמן הודעה כנענתה
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  // וידוא שהמשתמש הוא רב מאושר
  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
  });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  // וידוא שהשיעור שייך לרב
  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson || lesson.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }

  // וידוא שההודעה שייכת לשיעור
  const message = await db.chatMessage.findUnique({
    where: { id: params.msgId },
  });
  if (!message || message.lessonId !== lesson.id) {
    return NextResponse.json({ error: "הודעה לא נמצאה" }, { status: 404 });
  }

  const updated = await db.chatMessage.update({
    where: { id: message.id },
    data: { isAnswered: true },
  });

  return NextResponse.json(updated);
}
