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

  // התראה למארגן — דרך מייל, עובד גם לרב וגם לתלמיד
  if (lesson.organizerUserId) {
    const user = await db.user.findUnique({
      where: { id: lesson.organizerUserId },
      select: { email: true, student: { select: { id: true } }, rabbi: { select: { name: true } } },
    });
    const approved = newStatus === "APPROVED";
    const title = approved ? "האירוע שהצעת אושר" : "האירוע שהצעת נדחה";
    const body = approved
      ? `"${lesson.title}" אושר ע״י האדמין ופורסם לציבור.`
      : `"${lesson.title}" נדחה ע״י האדמין.`;

    // אם המארגן הוא תלמיד — דרך notifyStudent (in-app + email)
    if (user?.student) {
      await notifyStudent({
        studentId: user.student.id,
        kind: approved ? "EVENT_APPROVED" : "EVENT_REJECTED",
        title,
        body,
        link: approved ? `/lesson/${lesson.id}` : `/`,
      }).catch((e) => console.error("[events] notify student failed:", e));
    } else if (user?.email) {
      // רב — log בינתיים (notifyRabbi ייבנה בעתיד, או לשלוח מייל ישיר)
      console.log(`[events] rabbi notification to ${user.email}: ${title} — ${body}`);
    }
  }

  return NextResponse.json({ ok: true });
}
