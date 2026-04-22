/**
 * ייבוא אוטומטי של רשימת ערוצים מ-seed-channels.md כ-RabbiSource.
 * הסקריפט:
 *   1. לוקח @handle/URL לכל ערוץ
 *   2. פותר ל-channelId דרך YouTube Data API
 *   3. יוצר RabbiSource חדש (או מעדכן קיים)
 *   4. קישור ל-rabbi קיים אם נמצא לפי שם
 *
 * Usage:
 *   tsx scripts/seed-sources.ts           # טעינת הרשימה המובנית
 *   tsx scripts/seed-sources.ts --dry     # dry-run (לא שומר ל-DB)
 *
 * דורש: YOUTUBE_API_KEY ב-.env
 */
import { db } from "@/lib/db";

type SeedChannel = {
  handle: string;      // @handle או URL
  title: string;       // שם תצוגה
  rabbiName?: string;  // אם רוצים לקשר לרב קיים
  notes?: string;
  priority: 1 | 2 | 3;
};

const SEED_CHANNELS: SeedChannel[] = [
  // עדיפות 1 — ישיבות ומוסדות
  { handle: "@machonmeir", title: "מכון מאיר", notes: "הרב שלמה אבינר + הרב אורי שרקי", priority: 1 },
  { handle: "@harbracha", title: "ישיבת הר ברכה", rabbiName: "הרב אליעזר מלמד", notes: "פניני הלכה, פרשת שבוע", priority: 1 },
  { handle: "@merkazharav", title: "ישיבת מרכז הרב", rabbiName: "הרב יעקב שפירא", notes: "שיעורי ראש ישיבה", priority: 1 },
  { handle: "@harhamor", title: "ישיבת הר המור", notes: "הרב צבי טאו (תלמידיו)", priority: 1 },
  { handle: "@yrg1", title: "ישיבת רמת גן", rabbiName: "הרב יהושע שפירא", priority: 1 },
  // עדיפות 2 — רבנים
  { handle: "@hashmuel", title: "הרב שמואל אליהו", rabbiName: "הרב שמואל אליהו", notes: "רב צפת", priority: 2 },
  { handle: "@chaimnavon", title: "הרב חיים נבון", rabbiName: "הרב חיים נבון", priority: 2 },
  { handle: "@YehudaBrandes", title: "הרב יהודה ברנדס", rabbiName: "הרב יהודה ברנדס", priority: 2 },
  { handle: "@yeshivat-bnei-david", title: "ישיבת בני דוד", rabbiName: "הרב אלי סדן", priority: 2 },
  // עדיפות 3 — ארכיונים
  { handle: "@yeshivaorgil", title: "Yeshiva.org.il", notes: "ארכיון רב-רבני", priority: 3 },
  { handle: "@arutz7", title: "ערוץ 7 — אולפני תורה", notes: "ראיונות, פרשת שבוע", priority: 3 },
];

async function resolveChannelId(handleOrUrl: string, apiKey: string): Promise<{ channelId: string; title: string; channelUrl: string } | null> {
  let handle = handleOrUrl.trim();
  const m = handle.match(/@([a-zA-Z0-9_.-]+)/);
  if (m) handle = m[1];
  else handle = handle.replace(/^@/, "");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", `@${handle}`);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`   ❌ API error ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
    return null;
  }
  const data: any = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    channelUrl: `https://www.youtube.com/channel/${item.snippet.channelId}`,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry");
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("❌ YOUTUBE_API_KEY חסר ב-.env");
    process.exit(1);
  }

  console.log(`🌱 Seeding ${SEED_CHANNELS.length} sources ${dryRun ? "(DRY RUN)" : ""}\n`);

  let created = 0, updated = 0, skipped = 0, failed = 0;

  for (const seed of SEED_CHANNELS) {
    console.log(`\n📺 [Priority ${seed.priority}] ${seed.title}`);
    console.log(`   Handle: ${seed.handle}`);

    // פתרון channelId
    const resolved = await resolveChannelId(seed.handle, apiKey);
    if (!resolved) {
      console.log("   ❌ לא נמצא ערוץ");
      failed++;
      continue;
    }
    console.log(`   ✅ channelId: ${resolved.channelId}`);

    // קישור לרב קיים
    let rabbiId: string | null = null;
    if (seed.rabbiName) {
      const rabbi = await db.rabbi.findFirst({
        where: { name: { contains: seed.rabbiName } },
      });
      if (rabbi) {
        rabbiId = rabbi.id;
        console.log(`   🔗 מקושר לרב: ${rabbi.name}`);
      }
    }

    if (dryRun) {
      console.log("   (dry-run: לא נשמר)");
      continue;
    }

    // upsert
    const existing = await db.rabbiSource.findUnique({
      where: { platform_channelId: { platform: "YOUTUBE", channelId: resolved.channelId } },
    });

    if (existing) {
      await db.rabbiSource.update({
        where: { id: existing.id },
        data: {
          channelTitle: seed.title,
          channelUrl: resolved.channelUrl,
          rabbiName: seed.rabbiName ?? null,
          rabbiId: rabbiId ?? existing.rabbiId,
          notes: seed.notes ?? existing.notes,
          enabled: true,
        },
      });
      console.log("   🔄 עודכן");
      updated++;
    } else {
      await db.rabbiSource.create({
        data: {
          platform: "YOUTUBE",
          channelId: resolved.channelId,
          channelTitle: seed.title,
          channelUrl: resolved.channelUrl,
          rabbiName: seed.rabbiName ?? null,
          rabbiId,
          notes: seed.notes ?? null,
          enabled: true,
        },
      });
      console.log("   ✨ נוצר");
      created++;
    }
  }

  console.log("\n=== סיכום ===");
  console.log(`✨ נוצרו: ${created}`);
  console.log(`🔄 עודכנו: ${updated}`);
  console.log(`⏭️  דילוג: ${skipped}`);
  console.log(`❌ כשלו: ${failed}`);
  console.log("\nעכשיו אפשר להפעיל:");
  console.log("   gh workflow run detect-live.yml");
  console.log("או לחכות 15 דק' ל-cron האוטומטי.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("💥", e); process.exit(1); });
