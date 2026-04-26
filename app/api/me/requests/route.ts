import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — התלמיד רואה את כל הפניות שלו
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
  });
  if (!student) {
    return NextResponse.json({ error: "חשבון תלמיד לא נמצא" }, { status: 403 });
  }

  const requests = await db.contactRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      rabbi: { select: { name: true, slug: true } },
    },
  });

  // טעינת השיעורים המאושרים — כדי לדעת אם הם ציבוריים/פרטיים ומתי
  const approvedLessonIds = requests.map((r) => (r as any).approvedLessonId).filter(Boolean) as string[];
  const lessonsMap = new Map<string, { isPublic: boolean; scheduledAt: Date }>();
  if (approvedLessonIds.length > 0) {
    const lessons = await db.lesson.findMany({
      where: { id: { in: approvedLessonIds } },
      select: { id: true, isPublic: true, scheduledAt: true },
    });
    lessons.forEach((l) => lessonsMap.set(l.id, { isPublic: l.isPublic, scheduledAt: l.scheduledAt }));
  }

  const result = requests.map((r) => {
    const lessonId = (r as any).approvedLessonId ?? null;
    const lesson = lessonId ? lessonsMap.get(lessonId) : null;
    return {
      id: r.id,
      rabbiName: r.rabbi.name,
      rabbiSlug: r.rabbi.slug,
      message: r.message,
      reply: r.reply,
      requestType: r.requestType,
      topic: r.topic,
      requestedDate: r.requestedDate,
      requestedTime: r.requestedTime,
      status: r.status,
      approvedLessonId: lessonId,
      approvedLessonIsPublic: lesson?.isPublic ?? null,
      approvedLessonScheduledAt: lesson?.scheduledAt?.toISOString() ?? null,
      createdAt: r.createdAt,
      repliedAt: r.repliedAt,
    };
  });

  return NextResponse.json(result);
}
