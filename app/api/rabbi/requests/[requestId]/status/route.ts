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
  let createdLessonScheduledAt: Date | null = null;
  if (newStatus === "APPROVED" && contactRequest.topic) {
    let scheduledAt: Date;

    if (contactRequest.requestedDate) {
      scheduledAt = new Date(contactRequest.requestedDate);
      if (contactRequest.requestedTime) {
        const [hours, minutes] = contactRequest.requestedTime.split(":").map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
      } else {
        // אין שעה ספציפית — ברירת מחדל 20:00 (שעת ערב טיפוסית לשיעור)
        scheduledAt.setHours(20, 0, 0, 0);
      }
    } else {
      // ברירת מחדל — שבוע מהיום ב-20:00
      scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 7);
      scheduledAt.setHours(20, 0, 0, 0);
    }

    // הגנה: אם זמן השיעור עבר — דחה אוטומטית לאותה שעה מחר
    const now = new Date();
    if (scheduledAt < now) {
      scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      // השאר את השעה שהיתה אם הייתה תקפה
      if (contactRequest.requestedTime) {
        const [hours, minutes] = contactRequest.requestedTime.split(":").map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
      } else {
        scheduledAt.setHours(20, 0, 0, 0);
      }
    }

    const lesson = await db.lesson.create({
      data: {
        rabbiId: rabbi.id,
        title: contactRequest.topic,
        description: contactRequest.message || "",
        scheduledAt,
        durationMin: 60, // ברירת מחדל סבירה
        broadcastType: "LESSON",
        isPublic, // נבחר בממשק הרב — ציבורי (יופיע בלוח) או פרטי (רק ביומן הרב)
        approvalStatus: "APPROVED",
      },
    });
    createdLessonId = lesson.id;
    createdLessonScheduledAt = scheduledAt;
    // קישור הפנייה לשיעור — כדי שהתלמיד יוכל ללחוץ ישירות
    await db.contactRequest.update({
      where: { id: contactRequest.id },
      data: { approvedLessonId: lesson.id } as any,
    });
  }

  // התראה לתלמיד
  const statusText = newStatus === "APPROVED" ? "אושרה" : "נדחתה";
  let approvalBody = "";
  if (newStatus === "APPROVED") {
    const dateStr = createdLessonScheduledAt
      ? (() => {
          const d = createdLessonScheduledAt;
          const heb = new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", { day: "numeric", month: "long", year: "numeric" }).format(d);
          const time = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
          return `${heb} ב-${time}`;
        })()
      : "";
    approvalBody = isPublic
      ? `הרב אישר את בקשת השיעור — ${contactRequest.topic}.\nתאריך: ${dateStr}\nהשיעור פורסם בלוח השיעורים הציבורי באתר.`
      : `הרב אישר את בקשת השיעור — ${contactRequest.topic} — כאירוע פרטי.\nתאריך: ${dateStr}\nהאירוע נשמר ביומן שלך, אך לא בלוח הציבורי.`;
  } else {
    approvalBody = `הרב דחה את בקשת השיעור.${contactRequest.topic ? ` (נושא: ${contactRequest.topic})` : ""}`;
  }
  let notificationOk = true;
  try {
    await notifyStudent({
      studentId: contactRequest.studentId,
      kind: "CONTACT_REPLY" as any,
      title: `הבקשה שלך ${statusText} ע״י הרב ${rabbi.name}`,
      body: approvalBody,
      link: createdLessonId ? `/lesson/${createdLessonId}` : "/my/requests",
    });
  } catch (e) {
    console.error("[notify] failed to send to student:", e);
    notificationOk = false;
  }

  return NextResponse.json({
    ...updated,
    lessonId: createdLessonId,
    scheduledAt: createdLessonScheduledAt?.toISOString() ?? null,
    isPublic,
    notified: notificationOk,
  });
}
