import { NextResponse } from "next/server";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { lessonSchema } from "@/lib/validators";
import { notifyStudent } from "@/lib/notify";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { generateOccurrences, type RecurringRule } from "@/lib/recurring";

export async function POST(req: Request) {
  const { rabbi } = await requireApprovedRabbi();
  const body = await req.json().catch(() => null);
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // מאמת שהקטגוריה שייכת לרב
  if (data.categoryId) {
    const cat = await db.category.findFirst({ where: { id: data.categoryId, rabbiId: rabbi.id } });
    if (!cat) return NextResponse.json({ error: "קטגוריה לא תקינה" }, { status: 400 });
  }

  const baseData = {
    rabbiId: rabbi.id,
    title: data.title,
    description: data.description,
    categoryId: data.categoryId || null,
    durationMin: data.durationMin,
    language: data.language ?? "he",
    broadcastType: data.broadcastType ?? "LESSON",
    isLive: data.isLive ?? false,
    liveEmbedUrl: data.liveEmbedUrl || null,
    locationName: data.locationName || null,
    locationUrl: data.locationUrl || null,
    youtubeUrl: data.youtubeUrl || null,
    spotifyUrl: data.spotifyUrl || null,
    applePodcastUrl: data.applePodcastUrl || null,
    soundcloudUrl: data.soundcloudUrl || null,
    otherUrl: data.otherUrl || null,
    sourcesPdfUrl: data.sourcesPdfUrl || null,
    syncToCalendar: data.syncToCalendar ?? false,
  };

  if (data.isRecurring && data.recurringRule) {
    // שיעור מחזורי — יצירת מופעים עתידיים
    const rule = data.recurringRule as RecurringRule;
    const groupId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dates = generateOccurrences(rule);
    if (dates.length === 0) {
      return NextResponse.json({ error: "לא נוצרו מופעים — בדוק את הגדרות המחזוריות" }, { status: 400 });
    }

    const created = await db.$transaction(
      dates.map((d) =>
        db.lesson.create({
          data: {
            ...baseData,
            scheduledAt: d,
            isRecurring: true,
            recurringRule: JSON.stringify(rule),
            recurringGroupId: groupId,
          },
        })
      )
    );

    // הודעה לעוקבים רק על הראשון
    notifyFollowers(created[0].id, rabbi.id, data.title, dates[0]).catch(console.error);
    return NextResponse.json({ ok: true, id: created[0].id, count: created.length, groupId });
  }

  // שיעור רגיל (לא מחזורי)
  const lesson = await db.lesson.create({
    data: { ...baseData, scheduledAt: new Date(data.scheduledAt) },
  });

  notifyFollowers(lesson.id, rabbi.id, data.title, new Date(data.scheduledAt)).catch(console.error);
  return NextResponse.json({ ok: true, id: lesson.id });
}

async function notifyFollowers(lessonId: string, rabbiId: string, title: string, scheduledAt: Date) {
  const followers = await db.follow.findMany({
    where: { rabbiId, notifyOnNew: true },
    select: { studentId: true, rabbi: { select: { name: true } } },
  });
  await Promise.all(
    followers.map((f) =>
      notifyStudent({
        studentId: f.studentId,
        kind: "NEW_LESSON_FROM_RABBI",
        title: `${f.rabbi.name} פרסם שיעור חדש`,
        body: `${title} · ${formatHebrewDate(scheduledAt)} ${formatHebrewTime(scheduledAt)}`,
        link: `/lesson/${lessonId}`,
      })
    )
  );
}
