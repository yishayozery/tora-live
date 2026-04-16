import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  remindBeforeMin: z.coerce.number().int().min(0).max(24 * 60).default(30),
});

export async function POST(req: Request, { params }: { params: { lessonId: string } }) {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "רק תלמידים רשומים" }, { status: 403 });
  if (student.isBlocked) return NextResponse.json({ error: "חסום" }, { status: 403 });

  const lesson = await db.lesson.findUnique({ where: { id: params.lessonId } });
  if (!lesson) return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ערך תזכורת לא תקין" }, { status: 400 });

  await db.bookmark.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
    update: { remindBeforeMin: parsed.data.remindBeforeMin, reminderSentAt: null },
    create: {
      studentId: student.id,
      lessonId: lesson.id,
      remindBeforeMin: parsed.data.remindBeforeMin,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { lessonId: string } }) {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "רק תלמידים רשומים" }, { status: 403 });

  await db.bookmark.deleteMany({ where: { studentId: student.id, lessonId: params.lessonId } });
  return NextResponse.json({ ok: true });
}
