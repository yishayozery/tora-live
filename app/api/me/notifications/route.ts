import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

// סימון התראות כנקראות
export async function POST(req: Request) {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "לא תלמיד" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body?.ids;

  if (ids && Array.isArray(ids)) {
    await db.notification.updateMany({
      where: { studentId: student.id, id: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    });
  } else {
    await db.notification.updateMany({
      where: { studentId: student.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
