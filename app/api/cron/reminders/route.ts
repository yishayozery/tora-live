// נקרא ע"י Vercel Cron כל X דקות.
// בודק סימניות (Bookmark) ששיעורן מתחיל בעוד remindBeforeMin דקות (או פחות)
// ושעדיין לא נשלחה עליהן תזכורת, ושולח.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyStudent } from "@/lib/notify";
import { formatHebrewTime } from "@/lib/utils";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized();
  }

  const now = new Date();
  // חלון רחב מספיק: שיעורים בשעה הקרובה שעוד לא קיבלו תזכורת
  const horizon = new Date(now.getTime() + 60 * 60 * 1000);

  const due = await db.bookmark.findMany({
    where: {
      reminderSentAt: null,
      lesson: { scheduledAt: { gte: now, lte: horizon } },
    },
    include: { lesson: { include: { rabbi: true } }, student: true },
    take: 500,
  });

  let sent = 0;
  for (const bm of due) {
    const minutesUntil = Math.floor((bm.lesson.scheduledAt.getTime() - now.getTime()) / 60000);
    if (minutesUntil > bm.remindBeforeMin) continue;

    await notifyStudent({
      studentId: bm.studentId,
      kind: "LESSON_REMINDER",
      title: `השיעור מתחיל בעוד ${minutesUntil} דקות`,
      body: `${bm.lesson.title} · ${bm.lesson.rabbi?.name ?? (bm.lesson as any).organizerName ?? "אירוע"} · ${formatHebrewTime(bm.lesson.scheduledAt)}`,
      link: `/lesson/${bm.lesson.id}`,
    });
    await db.bookmark.update({ where: { id: bm.id }, data: { reminderSentAt: new Date() } });
    sent++;
  }

  return NextResponse.json({ ok: true, checked: due.length, sent });
}
