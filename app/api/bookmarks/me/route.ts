// מחזיר את כל ה-bookmarks של המשתמש הנוכחי כ-Set של lessonIds.
// השימוש: ה-WeeklyCalendar קורא בצד הלקוח אחרי טעינת הדף ההומה ה-ISR,
// כדי להציג סימון נכון בלי לכפות דינמיות על דף הבית.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ids: [], canBookmark: false });
  }
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isBlocked: true },
  });
  if (!student || student.isBlocked) {
    return NextResponse.json({ ids: [], canBookmark: false });
  }
  const bms = await db.bookmark.findMany({
    where: { studentId: student.id },
    select: { lessonId: true },
  });
  return NextResponse.json({
    ids: bms.map((b) => b.lessonId),
    canBookmark: true,
  });
}
