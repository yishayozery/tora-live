import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyStudent } from "@/lib/notify";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  // בעת אישור — לציין אם השיעור ציבורי (יוצג בלוח הכללי) או אירוע פרטי
  isPublic: z.boolean().optional().default(false),
});

// POST — רב מאשר או דוחה בקשת שיעור
export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
  });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const contactRequest = await db.contactRequest.findUnique({
    where: { id: params.requestId },
  });
  if (!contactRequest || contactRequest.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "פנייה לא נמצאה" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const newStatus = parsed.data.status;
  const isPublic = parsed.data.isPublic;

  // עדכון סטטוס הפנייה
  const updated = await db.contactRequest.update({
    where: { id: contactRequest.id },
    data: {
      status: newStatus,
      repliedAt: new Date(),
    },
  });

  // אם אישור — יצירת שיעור אוטומטית
  let createdLessonId: string | null = null;
  if (newStatus === "APPROVED" && contactRequest.topic) {
    let scheduledAt: Date;

    if (contactRequest.requestedDate) {
      scheduledAt = new Date(contactRequest.requestedDate);
      if (contactRequest.requestedTime) {
        const [hours, minutes] = contactRequest.requestedTime.split(":").map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
      }
    } else {
      // ברירת מחדל — שבוע מהיום ב-10:00
      scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 7);
      scheduledAt.setHours(10, 0, 0, 0);
    }

    const lesson = await db.lesson.create({
      data: {
        rabbiId: rabbi.id,
        title: contactRequest.topic,
        description: contactRequest.message || "",
        scheduledAt,
        broadcastType: "LESSON",
        isPublic, // נבחר בממשק הרב — ציבורי (יופיע בלוח) או פרטי (רק ביומן הרב)
        approvalStatus: "APPROVED",
      },
    });
    createdLessonId = lesson.id;
    // קישור הפנייה לשיעור — כדי שהתלמיד יוכל ללחוץ ישירות
    await db.contactRequest.update({
      where: { id: contactRequest.id },
      data: { approvedLessonId: lesson.id } as any,
    });
  }

  // התראה לתלמיד
  const statusText = newStatus === "APPROVED" ? "אושרה" : "נדחתה";
  const approvalBody = isPublic
    ? `הרב אישר את בקשת השיעור, והוא פורסם בלוח השיעורים הציבורי של האתר.`
    : `הרב אישר את בקשת השיעור כאירוע פרטי. תקבל הזמנה אישית לפני השיעור.`;
  await notifyStudent({
    studentId: contactRequest.studentId,
    kind: "CONTACT_REPLY" as any,
    title: `הבקשה שלך ${statusText} ע״י הרב ${rabbi.name}`,
    body: newStatus === "APPROVED" ? approvalBody : "הרב דחה את הבקשה.",
    link: createdLessonId ? `/lesson/${createdLessonId}` : "/my/requests",
  });

  return NextResponse.json({ ...updated, lessonId: createdLessonId, isPublic });
}
