import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelTemplate } from "@/lib/recurring-lessons";

// DELETE — ביטול סדרת שיעורים (מוחק שיעורים עתידיים שלא נערכו ידנית)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });
  }

  const deleted = await cancelTemplate(params.id, true);
  return NextResponse.json({ ok: true, deletedLessons: deleted });
}

// PATCH — שינוי סטטוס (PAUSE/RESUME)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (status !== "ACTIVE" && status !== "PAUSED") {
    return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
  }

  await db.recurringLessonTemplate.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json({ ok: true });
}
