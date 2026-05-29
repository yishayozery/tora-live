// לוגיקת מוסדות — provisioning של חדר (Cloudflare Live Input קבוע), עזרי הרשאה.
import { db } from "@/lib/db";
import { createLiveInput, getPlaybackUrl } from "@/lib/stream";
import { randomBytes } from "crypto";

/**
 * מקים חדר חדש למוסד — כולל יצירת Cloudflare Live Input קבוע.
 * ה-credentials (RTMP + key + playback) נשמרים על החדר לכל החיים.
 * הרכז מקליד אותם ב-Pi/OBS פעם אחת.
 */
export async function provisionRoom(params: {
  institutionId: string;
  institutionName: string;
  name: string;
  description?: string;
}) {
  const { institutionId, institutionName, name, description } = params;

  // יוצרים Live Input קבוע ב-Cloudflare. שם תיאורי לזיהוי בדשבורד CF.
  const input = await createLiveInput(`${institutionName} — ${name}`);
  const playback = getPlaybackUrl(input.uid);

  // טוקן אימות ל-Pi (Phase B) — מאפשר ל-Pi לעשות polling מאומת.
  const deviceToken = randomBytes(24).toString("hex");

  return db.room.create({
    data: {
      institutionId,
      name,
      description: description || null,
      streamInputUid: input.uid,
      streamKey: input.rtmps.streamKey,
      rtmpUrl: input.rtmps.url,
      playbackUrl: playback || null,
      deviceToken,
    },
  });
}

/** האם המשתמש רכז של המוסד (או אדמין-על). */
export async function isRakazOf(userId: string, institutionId: string, userEmail?: string | null): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()?.trim();
  if (adminEmail && userEmail?.toLowerCase()?.trim() === adminEmail) return true;
  const m = await db.institutionMember.findUnique({
    where: { institutionId_userId: { institutionId, userId } },
  });
  return !!m && m.role === "RAKAZ";
}

/**
 * מוצא את השיעור הפעיל בחדר כרגע — לפי לוח הזמנים.
 * שיעור "פעיל" = scheduledAt בטווח [now - durationMin, now + 30min grace].
 * משמש כדי לקשר את הזרם של החדר לדף השיעור הנכון אוטומטית.
 */
export async function findActiveLessonForRoom(roomId: string) {
  const now = new Date();
  const lessons = await db.lesson.findMany({
    where: {
      roomId,
      isSuspended: false,
      scheduledAt: { lte: new Date(now.getTime() + 30 * 60_000) }, // עד 30 דק' לפני
    },
    orderBy: { scheduledAt: "desc" },
    take: 5,
  });
  // הקרוב ביותר שעוד בטווח (לא הסתיים)
  return lessons.find((l) => {
    const start = l.scheduledAt.getTime();
    const end = start + (l.durationMin ?? 60) * 60_000 + 30 * 60_000;
    return now.getTime() >= start - 6 * 3600_000 && now.getTime() <= end;
  }) ?? null;
}
