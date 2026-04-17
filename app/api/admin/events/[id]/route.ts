import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { notifyStudent } from "@/lib/notify";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      approvalStatus: true,
      organizerUserId: true,
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const newStatus = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";

  await db.lesson.update({
    where: { id: params.id },
    data: { approvalStatus: newStatus },
  });

  // התראה למארגן — רק אם הוא תלמיד
  if (lesson.organizerUserId) {
    const student = await db.student.findUnique({
      where: { userId: lesson.organizerUserId },
      select: { id: true },
    });
    if (student) {
      const approved = newStatus === "APPROVED";
      await notifyStudent({
        studentId: student.id,
        kind: approved ? "EVENT_APPROVED" : "EVENT_REJECTED",
        title: approved
          ? "האירוע שהצעת אושר"
          : "האירוע שהצעת נדחה",
        body: approved
          ? `"${lesson.title}" אושר ע״י האדמין ופורסם לציבור.`
          : `"${lesson.title}" נדחה ע״י האדמין.`,
        link: approved ? `/lesson/${lesson.id}` : `/`,
      }).catch((e) => console.error("[events] notify failed:", e));
    }
  }

  return NextResponse.json({ ok: true });
}
