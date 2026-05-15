/**
 * סיום ידני של שיעור שנתקע במצב isLive=true.
 * Usage: node --env-file=.env --import tsx scripts/force-end-live.ts <lesson-id>
 * אם בלי argument — מציג רשימת כל השיעורים התקועים.
 */
import { db } from "@/lib/db";

async function main() {
  const id = process.argv[2];

  if (!id) {
    const stuck = await db.lesson.findMany({
      where: { isLive: true },
      select: { id: true, title: true, liveMethod: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    if (stuck.length === 0) {
      console.log("✅ אין שיעורים תקועים במצב live.");
      return;
    }
    console.log(`\n⚠️  ${stuck.length} שיעורים במצב live כעת:\n`);
    stuck.forEach((l) => {
      console.log(`  ${l.id} | ${l.liveMethod} | עודכן ${l.updatedAt.toISOString()} | ${l.title}`);
    });
    console.log(`\nלסיום: node --env-file=.env --import tsx scripts/force-end-live.ts <lesson-id>`);
    return;
  }

  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson) { console.log("❌ לא נמצא"); return; }
  if (!lesson.isLive) { console.log("ℹ️ השיעור כבר לא במצב live."); return; }

  await db.lesson.update({
    where: { id },
    data: {
      isLive: false,
      // לא דורסים streamId/playbackUrl/liveEmbedUrl — אם בעתיד נצליח לקבל הקלטה,
      // הם נשארים. אם לא — ה-cron של ה-cleanup ינקה.
    },
  });
  console.log(`✅ ${lesson.title}: isLive=false`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
