import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const chatMessageSchema = z.object({
  content: z.string().min(2, "תוכן קצר מדי").max(1000, "תוכן ארוך מדי"),
});

// POST — תלמיד שולח שאלה
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  if (student.isBlocked) {
    return NextResponse.json({ error: "אינך מורשה לשלוח הודעות" }, { status: 403 });
  }

  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const message = await db.chatMessage.create({
    data: {
      lessonId: lesson.id,
      studentId: student.id,
      content: parsed.data.content,
    },
  });

  return NextResponse.json(message, { status: 201 });
}

// GET — קריאת כל ההודעות (ציבורי)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }

  const messages = await db.chatMessage.findMany({
    where: { lessonId: lesson.id },
    orderBy: { createdAt: "asc" },
    include: { student: { select: { name: true } } },
  });

  const result = messages.map((m) => ({
    id: m.id,
    content: m.content,
    studentName: m.student.name,
    isAnswered: m.isAnswered,
    createdAt: m.createdAt,
  }));

  return NextResponse.json(result);
}
