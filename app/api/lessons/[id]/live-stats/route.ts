import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * מחזיר סטטיסטיקות שידור חי — צופים ומונה הודעות.
 * "Viewer count" כאן = הערכה: viewCount של השיעור (נאסף מצפיות) + מי שכתב בצ'אט ב-10 דקות אחרונות.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const lesson = await db.lesson.findUnique({
    where: { id: params.id },
    select: { viewCount: true, isLive: true },
  });
  if (!lesson) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  // מספר תלמידים ייחודיים שכתבו בצ'אט ב-10 דק׳ האחרונות — פרוקסי לצופים פעילים
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const activeStudents = await db.chatMessage.findMany({
    where: { lessonId: params.id, createdAt: { gte: tenMinAgo } },
    select: { studentId: true },
    distinct: ["studentId"],
  });

  const messageCount = await db.chatMessage.count({ where: { lessonId: params.id } });

  return NextResponse.json({
    isLive: lesson.isLive,
    viewerCount: Math.max(activeStudents.length, Math.floor((lesson.viewCount ?? 0) / 10)),
    activeViewers: activeStudents.length,
    totalViews: lesson.viewCount ?? 0,
    messageCount,
  });
}
