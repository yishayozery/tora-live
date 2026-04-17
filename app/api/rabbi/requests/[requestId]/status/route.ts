import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyStudent } from "@/lib/notify";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
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

  // עדכון סטטוס הפנייה
  const updated = await db.contactRequest.update({
    where: { id: contactRequest.id },
    data: {
      status: newStatus,
      repliedAt: new Date(),
    },
  });

  // אם אישור — יצירת שיעור אוטומטית
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

    await db.lesson.create({
      data: {
        rabbiId: rabbi.id,
        title: contactRequest.topic,
        description: contactRequest.message || "",
        scheduledAt,
        broadcastType: "LESSON",
        // אירוע שנוצר מבקשה — ברירת מחדל פרטי. הרב יוכל לפרסם אם ירצה
        isPublic: false,
      },
    });
  }

  // התראה לתלמיד
  const statusText = newStatus === "APPROVED" ? "אושרה" : "נדחתה";
  await notifyStudent({
    studentId: contactRequest.studentId,
    kind: "CONTACT_REPLY" as any,
    title: `הבקשה שלך ${statusText} ע״י הרב ${rabbi.name}`,
    body: newStatus === "APPROVED"
      ? "הרב אישר את בקשת השיעור. השיעור נוסף ללוח."
      : "הרב דחה את הבקשה.",
    link: "/my/requests",
  });

  return NextResponse.json(updated);
}
