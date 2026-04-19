/**
 * Import past lessons for ONE rabbi from their YouTube channel.
 * Creates the Rabbi entity (if missing) + 20 past lessons with playback URLs.
 *
 * Usage:
 *   tsx scripts/import-rabbi-past.ts <channelId> <rabbiName> <slug>
 *
 * Example:
 *   tsx scripts/import-rabbi-past.ts UCkwxRNj-7Iu1LlHJfKzl2Gw "הרב אליעזר מלמד" eliezer-melamed
 */
import { db } from "../lib/db";
import { listUploadsViaPlaylist, getVideos, parseDurationMin, hasHebrew, guessBroadcastType } from "../lib/youtube";
import bcrypt from "bcryptjs";

async function main() {
  const [channelId, rabbiName, slug] = process.argv.slice(2);
  if (!channelId || !rabbiName || !slug) {
    console.error("Usage: tsx scripts/import-rabbi-past.ts <channelId> <rabbiName> <slug>");
    process.exit(1);
  }

  // 1. Find or create Rabbi user + Rabbi entity (auto-approved as a "demo seeded rabbi")
  let user = await db.user.findFirst({ where: { rabbi: { slug } } });
  let rabbi = await db.rabbi.findUnique({ where: { slug } });

  if (!rabbi) {
    console.log(`👤 יוצר רב חדש: ${rabbiName} (${slug})`);
    const passwordHash = await bcrypt.hash("temp-" + Math.random().toString(36).slice(2, 10), 10);
    const photoArg = process.argv[5] || null;
    user = await db.user.create({
      data: {
        email: `${slug}@external.tora-live.co.il`,
        passwordHash,
        role: "RABBI",
        rabbi: {
          create: {
            name: rabbiName,
            slug,
            bio: `${rabbiName} — שיעורים מתוך ערוץ ה-YouTube הרשמי.\nתוכן זמין לצפייה תחת רישיונות YouTube הרגילים.`,
            photoUrl: photoArg,  // אופציונלי: arg רביעי הוא URL לתמונה
            status: "APPROVED",
            profileCompleted: true,
          },
        },
      },
      include: { rabbi: true },
    });
    rabbi = user.rabbi;
    console.log(`✅ רב נוצר: id=${rabbi!.id}`);
  } else {
    console.log(`👤 רב קיים: ${rabbiName} (id=${rabbi.id})`);
  }

  // 2. Fetch recent videos via uploads playlist (returns ALL uploads, not search-filtered)
  console.log(`📺 שואב 50 video אחרונים מ-uploads playlist...`);
  const ids = await listUploadsViaPlaylist(channelId, 50);
  if (!ids.length) { console.error("❌ לא נמצאו videos"); process.exit(1); }
  console.log(`📥 ${ids.length} video IDs נשלפו, טוען פרטים...`);
  const videos = await getVideos(ids);
  console.log(`📥 ${videos.length} videos נטענו`);

  // 3. Insert as APPROVED past lessons
  let inserted = 0, dup = 0, filtered = 0;
  for (const v of videos) {
    if (!hasHebrew(v.snippet.title)) { filtered++; continue; }
    const durationMin = parseDurationMin(v.contentDetails?.duration || "PT60M");
    if (durationMin < 5) { filtered++; continue; }  // shorts

    const externalId = v.id;
    const existing = await db.lesson.findUnique({ where: { externalId } });
    if (existing) { dup++; continue; }

    const live = v.liveStreamingDetails;
    const scheduledAt = new Date(live?.actualStartTime || live?.scheduledStartTime || v.snippet.publishedAt);

    await db.lesson.create({
      data: {
        title: v.snippet.title.slice(0, 300),
        description: (v.snippet.description || v.snippet.title).slice(0, 1500),
        scheduledAt,
        durationMin,
        broadcastType: guessBroadcastType(v.snippet.title),
        isPublic: true,
        approvalStatus: "APPROVED",  // הקלטות עבר — מאושרות מיידית
        rabbiId: rabbi!.id,
        organizerName: null,
        youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
        liveEmbedUrl: `https://www.youtube.com/embed/${v.id}`,
        playbackUrl: `https://www.youtube.com/watch?v=${v.id}`,
        posterUrl: v.snippet.thumbnails?.standard?.url || v.snippet.thumbnails?.high?.url || null,
        externalId,
        autoDiscovered: true,
        discoveredAt: new Date(),
        isLive: false,
      },
    });
    inserted++;
  }

  console.log(`\n📊 סיכום:`);
  console.log(`   ✅ נוספו: ${inserted}`);
  console.log(`   🔁 כפילויות: ${dup}`);
  console.log(`   ⏭️  סוננו (shorts/לא עברית): ${filtered}`);
  console.log(`\n👉 צפה בדף הרב: http://localhost:3000/rabbi/${slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
