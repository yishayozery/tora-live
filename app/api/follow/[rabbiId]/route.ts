import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

async function getStudent(userId: string) {
  return db.student.findUnique({ where: { userId } });
}

export async function POST(_req: Request, { params }: { params: { rabbiId: string } }) {
  const session = await requireSession();
  const student = await getStudent(session.user.id);
  if (!student) return NextResponse.json({ error: "רק תלמידים רשומים" }, { status: 403 });
  if (student.isBlocked) return NextResponse.json({ error: "חסום" }, { status: 403 });

  const rabbi = await db.rabbi.findUnique({ where: { id: params.rabbiId } });
  if (!rabbi || rabbi.status !== "APPROVED") return NextResponse.json({ error: "רב לא נמצא" }, { status: 404 });

  await db.follow.upsert({
    where: { studentId_rabbiId: { studentId: student.id, rabbiId: rabbi.id } },
    update: { notifyOnNew: true },
    create: { studentId: student.id, rabbiId: rabbi.id },
  });
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(_req: Request, { params }: { params: { rabbiId: string } }) {
  const session = await requireSession();
  const student = await getStudent(session.user.id);
  if (!student) return NextResponse.json({ error: "רק תלמידים רשומים" }, { status: 403 });

  await db.follow.deleteMany({ where: { studentId: student.id, rabbiId: params.rabbiId } });
  return NextResponse.json({ ok: true, following: false });
}
