import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — רב מקבל את כל הפניות שלו
export async function GET() {
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

  // ממוין asc כדי למספר מהראשונה (#1) ולא ההפך. ה-UI תופס את זה כפי שצריך.
  const requests = await db.contactRequest.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { createdAt: "asc" },
    include: {
      // טלפון של התלמיד נחשף לרב כדי שיוכל להתקשר / לשלוח WhatsApp.
      // המייל מגיע מ-User. שניהם רק בידי הרב שהפנייה מיועדת אליו.
      student: {
        select: {
          name: true,
          phoneE164: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  const result = requests.map((r, idx) => ({
    id: r.id,
    // מספר פנייה רץ — פנייה ראשונה = #1, פנייה אחרונה = #N. מתאים לזיהוי קל
    // וגם להתייחסות בהודעות לתלמיד ("פנייה #42 שלך עברה לטיפול").
    requestNumber: idx + 1,
    studentName: r.student.name,
    studentPhone: r.student.phoneE164,
    studentEmail: r.student.user?.email ?? null,
    message: r.message,
    reply: r.reply,
    requestType: r.requestType,
    topic: r.topic,
    requestedDate: r.requestedDate,
    requestedTime: r.requestedTime,
    status: r.status,
    // השיעור שנוצר מהפנייה (אם אושר) — מאפשר ניווט ישיר
    approvedLessonId: (r as any).approvedLessonId ?? null,
    createdAt: r.createdAt,
    repliedAt: r.repliedAt,
  })).reverse(); // ב-UI מציגים מהאחרון לראשון, אבל המספור כבר הוקצה לפי סדר יצירה

  return NextResponse.json(result);
}
