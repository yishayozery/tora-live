import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { REPORT_THRESHOLD } from "@/lib/config";
import { notifyStudent } from "@/lib/notify";

const reportSchema = z.object({
  category: z.enum(["INAPPROPRIATE", "SPAM", "TECHNICAL"]),
  description: z.string().min(3, "נדרש תיאור קצר").max(500),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();

  // תלמיד חסום לא יכול לדווח
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { isBlocked: true },
  });
  if (student?.isBlocked) {
    return NextResponse.json({ error: "משתמש חסום" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, reportCount: true, isSuspended: true,
      rabbiId: true,
      rabbi: { select: { id: true, name: true, isBlocked: true } },
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }

  const reporterEmail = session.user.email ?? "";

  // בדיקת כפילות — אותו משתמש דיווח על אותו שיעור וה-דיווח עדיין OPEN
  if (reporterEmail) {
    const existing = await db.report.findFirst({
      where: { lessonId: lesson.id, reporterEmail, status: "OPEN" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "כבר דיווחת על שיעור זה" }, { status: 409 });
    }
  }

  await db.report.create({
    data: {
      lessonId: lesson.id,
      reporterEmail: reporterEmail || null,
      category: parsed.data.category,
      description: parsed.data.description,
      status: "OPEN",
    },
  });

  const newCount = lesson.reportCount + 1;
  const shouldSuspend = !lesson.isSuspended && newCount >= REPORT_THRESHOLD;

  await db.lesson.update({
    where: { id: lesson.id },
    data: {
      reportCount: newCount,
      ...(shouldSuspend ? { isSuspended: true } : {}),
    },
  });

  if (shouldSuspend) {
    // stub — התראה לאדמין
    console.log(
      `[report] lesson "${lesson.title}" (${lesson.id}) reached threshold ${REPORT_THRESHOLD} — suspended.`
    );

    // === חסימת הרב אוטומטית ===
    // כשיעור מגיע לסף דיווחים, הרב נחסם לבדיקת אדמין.
    // האדמין יכול לבטל חסימה ב-/admin/rabbis אחרי בדיקה.
    if (lesson.rabbi && !lesson.rabbi.isBlocked) {
      await db.rabbi.update({
        where: { id: lesson.rabbi.id },
        data: { isBlocked: true },
      });
      console.log(
        `[report] rabbi "${lesson.rabbi.name}" (${lesson.rabbi.id}) auto-blocked due to report threshold.`
      );
    }

    // אם האדמין רשום כתלמיד — גם התראה in-app
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    if (adminEmail) {
      const adminUser = await db.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
      });
      if (adminUser) {
        const adminStudent = await db.student.findUnique({
          where: { userId: adminUser.id },
          select: { id: true },
        });
        if (adminStudent) {
          const rabbiNote = lesson.rabbi && !lesson.rabbi.isBlocked
            ? `\n\n⚠️ הרב ${lesson.rabbi.name} נחסם אוטומטית. בדוק ב-/admin/rabbis.`
            : "";
          await notifyStudent({
            studentId: adminStudent.id,
            kind: "LESSON_SUSPENDED",
            title: "שיעור הושהה אוטומטית",
            body: `"${lesson.title}" קיבל ${newCount} דיווחים והושהה זמנית. נדרשת בדיקה.${rabbiNote}`,
            link: `/admin/reports`,
          }).catch(console.error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, suspended: shouldSuspend });
}
