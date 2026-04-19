/**
 * Import all Musayof weekly recurring lessons → expand to next 7 days as Lesson rows.
 * Plus add Kotel 24/7 livestream as a permanent lesson.
 */
import * as fs from "fs/promises";
import { db } from "../lib/db";

type Slot = { day: number; time: string; duration: number; rabbi: string; topic: string };

const MUSAYOF_LIVE_URL = "https://www.musayof.co.il/בית-הכנסת-מוסאיוף-שידור-חי";
const MUSAYOF_LOCATION = "בית הכנסת מוסאיוף, רחוב יואל 25, ירושלים";

function nextOccurrence(dayOfWeek: number, time: string, baseDate: Date): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  let delta = (dayOfWeek - d.getDay() + 7) % 7;
  // אם זה היום וכבר עבר — דחה לשבוע הבא
  if (delta === 0 && d.getTime() < baseDate.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tora-live.co.il";
  const admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) { console.error(`❌ Admin ${adminEmail} not found`); process.exit(1); }

  // ---- Musayof ----
  const raw = JSON.parse(await fs.readFile("data/musayof-schedule.json", "utf8"));
  const slots: Slot[] = raw.lessons;
  const now = new Date();
  let inserted = 0, dup = 0;

  for (const s of slots) {
    const scheduledAt = nextOccurrence(s.day, s.time, now);
    const externalId = `musayof-${s.day}-${s.time}-${s.rabbi.replace(/\s+/g, "_")}`;
    const existing = await db.lesson.findUnique({ where: { externalId } });
    if (existing) { dup++; continue; }
    await db.lesson.create({
      data: {
        title: `${s.topic} — ${s.rabbi}`,
        description: `שיעור שבועי קבוע בבית כנסת מוסאיוף.\n🎤 ${s.rabbi}\n📚 ${s.topic}\n📍 ${MUSAYOF_LOCATION}\n\n*שיעור זה חוזר מדי שבוע באותו יום ושעה.*`,
        scheduledAt,
        durationMin: s.duration,
        broadcastType: "LESSON",
        isPublic: true,
        approvalStatus: "PENDING",
        organizerUserId: admin.id,
        organizerName: s.rabbi,
        locationName: "בית הכנסת מוסאיוף, ירושלים",
        locationUrl: "https://maps.google.com/?q=רחוב+יואל+25+ירושלים",
        otherUrl: MUSAYOF_LIVE_URL,
        externalId,
        autoDiscovered: true,
        discoveredAt: new Date(),
        isRecurring: true,
        recurringRule: JSON.stringify({ freq: "WEEKLY", dayOfWeek: s.day, hour: parseInt(s.time.split(":")[0]), minute: parseInt(s.time.split(":")[1]) }),
        recurringGroupId: `musayof-${s.day}-${s.time}`,
      },
    });
    inserted++;
  }

  console.log(`📥 Musayof: ${inserted} שיעורים נוספו, ${dup} כפילויות`);

  // ---- Kotel 24/7 ----
  const kotelExternalId = "kotel-earthcam-247";
  const existing = await db.lesson.findUnique({ where: { externalId: kotelExternalId } });
  if (!existing) {
    await db.lesson.create({
      data: {
        title: "🕊️ הכותל המערבי — שידור חי 24/7",
        description: "שידור חי קבוע מהכותל המערבי, 24 שעות ביממה. צפו בכל רגע ברחבת הכותל בירושלים.\n\n📍 רחבת הכותל המערבי, ירושלים\n📡 Powered by EarthCam",
        scheduledAt: new Date(),
        durationMin: 1440,
        broadcastType: "PRAYER",
        isPublic: true,
        approvalStatus: "APPROVED",  // קבוע — מאושר מיידית
        organizerUserId: admin.id,
        organizerName: "הכותל המערבי",
        locationName: "רחבת הכותל המערבי, ירושלים",
        locationUrl: "https://maps.google.com/?q=Western+Wall+Jerusalem",
        youtubeUrl: "https://www.youtube.com/watch?v=77akujLn4k8",
        liveEmbedUrl: "https://www.youtube.com/embed/77akujLn4k8",
        externalId: kotelExternalId,
        autoDiscovered: true,
        discoveredAt: new Date(),
        isLive: true,  // תמיד חי
        isRecurring: true,
        recurringRule: JSON.stringify({ freq: "DAILY", continuous: true }),
      },
    });
    console.log(`📥 Kotel: שידור 24/7 נוסף ומאושר אוטומטית`);
  } else {
    console.log(`📥 Kotel: כבר קיים`);
  }

  // סיכום
  const total = await db.lesson.count();
  const pending = await db.lesson.count({ where: { approvalStatus: "PENDING" } });
  console.log(`\n📊 סה"כ שיעורים במערכת: ${total} (מתוכם ${pending} ממתינים לאישור)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
