/**
 * Import lessons from a JSON file (research output) into the DB.
 * Usage: node --env-file=.env --import tsx scripts/import-lessons.ts <file.json>
 */
import * as fs from "fs/promises";
import { db } from "../lib/db";

type RawLesson = {
  title: string;
  rabbi?: string;
  scheduledAt: string;
  durationMin?: number;
  url: string;
  youtubeVideoId?: string;
  channelName?: string;
  locationName?: string | null;
  broadcastType?: string;
  source?: string;
  confidence?: string;
  note?: string;
};

function isYoutubeUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/live\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: tsx scripts/import-lessons.ts <file.json>");
    process.exit(1);
  }

  const raw = await fs.readFile(file, "utf8");
  const items: RawLesson[] = JSON.parse(raw);
  console.log(`📥 Loaded ${items.length} candidate lessons from ${file}`);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@tora-live.co.il";
  const admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    console.error(`❌ Admin user ${adminEmail} not found`);
    process.exit(1);
  }

  let inserted = 0, skipped = 0, duplicates = 0, invalid = 0;

  for (const item of items) {
    if (!item.title || !item.url || item.scheduledAt === "UNKNOWN") {
      invalid++;
      continue;
    }

    const scheduledAt = new Date(item.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      console.log(`⚠️  Invalid date: ${item.title}`);
      invalid++;
      continue;
    }

    // Skip past lessons (more than 1h ago)
    if (scheduledAt.getTime() < Date.now() - 60 * 60 * 1000) {
      skipped++;
      continue;
    }

    const ytId = item.youtubeVideoId || isYoutubeUrl(item.url);
    const externalId = ytId
      ? ytId
      : `manual-${Buffer.from(`${item.url}|${item.title}|${item.scheduledAt}`).toString("base64").slice(0, 32)}`;

    // duplicate check
    const existing = await db.lesson.findUnique({ where: { externalId } });
    if (existing) {
      duplicates++;
      continue;
    }

    try {
      await db.lesson.create({
        data: {
          title: item.title.slice(0, 300),
          description: [
            item.rabbi ? `🎤 ${item.rabbi}` : "",
            item.locationName ? `📍 ${item.locationName}` : "",
            item.source ? `\nמקור: ${item.source}` : "",
            item.note ? `\nהערה: ${item.note}` : "",
          ].filter(Boolean).join(" ").trim() || item.title,
          scheduledAt,
          durationMin: item.durationMin || 60,
          broadcastType: (item.broadcastType?.toUpperCase() === "PRAYER" ? "PRAYER" :
                          item.broadcastType?.toUpperCase() === "EVENT" ? "EVENT" : "LESSON"),
          isPublic: true,
          approvalStatus: "PENDING",
          organizerUserId: admin.id,
          organizerName: item.rabbi || item.channelName || "—",
          locationName: item.locationName || null,
          youtubeUrl: isYoutubeUrl(item.url) ? item.url : null,
          otherUrl: !isYoutubeUrl(item.url) ? item.url : null,
          liveEmbedUrl: isYoutubeUrl(item.url) ? `https://www.youtube.com/embed/${isYoutubeUrl(item.url)}` : null,
          externalId,
          autoDiscovered: true,
          discoveredAt: new Date(),
        },
      });
      inserted++;
      console.log(`✅ ${item.title.slice(0, 60)} — ${item.rabbi || ""}`);
    } catch (e: any) {
      console.error(`❌ Failed: ${item.title} — ${e.message}`);
      invalid++;
    }
  }

  console.log(`\n📊 Done:`);
  console.log(`   ✅ Inserted:   ${inserted}`);
  console.log(`   🔁 Duplicates: ${duplicates}`);
  console.log(`   ⏭️  Skipped (past): ${skipped}`);
  console.log(`   ⚠️  Invalid:    ${invalid}`);
  console.log(`\n👉 צפה ב-/admin/lessons — סטטוס "ממתין לאישור"`);
}

main().catch((e) => { console.error(e); process.exit(1); });
