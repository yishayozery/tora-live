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
  trusted?: boolean;   // אם true — פרסום אוטומטי ללא אישור אדמין
};

const SEED_CHANNELS: SeedChannel[] = [
  // === עדיפות 1 — ישיבות גבוהות ומוסדות מרכזיים (trusted) ===
  { handle: "@machonmeir", title: "מכון מאיר", notes: "הרב שלמה אבינר + הרב אורי שרקי", priority: 1, trusted: true },
  { handle: "@harbracha", title: "ישיבת הר ברכה", rabbiName: "הרב אליעזר מלמד", notes: "פניני הלכה, פרשת שבוע", priority: 1, trusted: true },
  { handle: "@merkazharav", title: "ישיבת מרכז הרב", rabbiName: "הרב יעקב שפירא", notes: "שיעורי ראש ישיבה", priority: 1, trusted: true },
  { handle: "@harhamor", title: "ישיבת הר המור", notes: "הרב צבי טאו (תלמידיו)", priority: 1, trusted: true },
  { handle: "@yrg1", title: "ישיבת רמת גן", rabbiName: "הרב יהושע שפירא", priority: 1, trusted: true },

  // === עדיפות 1 — ישיבות הסדר מרכזיות (trusted) ===
  { handle: "@yhe-haretzion", title: "ישיבת הר עציון (גוש)", notes: "הרב ברוך גיגי, הרב מאיר ליכטנשטיין", priority: 1, trusted: true },
  { handle: "@YeshivatOrotShaul", title: "ישיבת אורות שאול", notes: "הרב יובל שרלו, הרב ראם הכהן", priority: 1, trusted: true },
  { handle: "@shaalvim", title: "ישיבת שעלבים", notes: "הרב דוד פנדל", priority: 1, trusted: true },
  { handle: "@kby_il", title: "ישיבת כרם ביבנה", notes: "הרב מרדכי גרינברג", priority: 1, trusted: true },
  { handle: "@yeshivatmaalot", title: "ישיבת מעלות", priority: 1, trusted: true },
  { handle: "@YKS-il", title: "ישיבת קריית שמונה", priority: 1, trusted: true },
  { handle: "@MachonLev", title: "מכון לב — מרכז אקדמי לב", notes: "ישיבת השילוב", priority: 1, trusted: true },

  // === עדיפות 2 — רבנים אישיים פעילים (trusted) ===
  { handle: "@hashmuel", title: "הרב שמואל אליהו", rabbiName: "הרב שמואל אליהו", notes: "רב צפת", priority: 2, trusted: true },
  { handle: "@chaimnavon", title: "הרב חיים נבון", rabbiName: "הרב חיים נבון", priority: 2, trusted: true },
  { handle: "@YehudaBrandes", title: "הרב יהודה ברנדס", rabbiName: "הרב יהודה ברנדס", priority: 2, trusted: true },
  { handle: "@yeshivat-bnei-david", title: "ישיבת בני דוד עלי", rabbiName: "הרב אלי סדן", priority: 2, trusted: true },
  { handle: "@RavEliyahu", title: "הרב מרדכי אליהו", notes: "ארכיון הרב מרדכי אליהו זצ״ל", priority: 2, trusted: true },
  { handle: "@RavShmueliz", title: "הרב יצחק שאול שמואלי", priority: 2, trusted: true },
  { handle: "@ShimonEdery", title: "הרב שמעון אדרי", priority: 2, trusted: true },
  { handle: "@RavAbiner", title: "הרב שלמה אבינר", rabbiName: "הרב שלמה אבינר", priority: 2, trusted: true },
  { handle: "@zvigolombik", title: "הרב צבי גולומבק", priority: 2, trusted: true },

  // === עדיפות 2 — רבני צהר וקהילה (trusted) ===
  { handle: "@tzohar-il", title: "רבני צהר", notes: "ארגון רבני צהר — שיחות ושיעורים", priority: 2, trusted: true },
  { handle: "@bneiakiva", title: "בני עקיבא העולמית", notes: "הרב אוהד טהרלב + משפיעים", priority: 2, trusted: true },
  { handle: "@Mizrachi_Org", title: "מזרחי עולמי", notes: "תורה לציבור הדתי-לאומי בחו״ל", priority: 2, trusted: true },

  // === עדיפות 3 — ארכיונים ותוכן מגוון (pending — דורש אישור ידני) ===
  { handle: "@yeshivaorgil", title: "Yeshiva.org.il", notes: "ארכיון רב-רבני — 100+ רבנים", priority: 3, trusted: false },
  { handle: "@arutz7", title: "ערוץ 7 — אולפני תורה", notes: "ראיונות, פרשת שבוע", priority: 3, trusted: false },
  { handle: "@kipa_yeshiva", title: "כיפה — תורה ושיעורים", notes: "אתר כיפה — שיעורי רבנים מגוונים", priority: 3, trusted: false },
  { handle: "@torahcity", title: "Torah City", notes: "שיעורי תורה מהארץ ומחו״ל", priority: 3, trusted: false },
  { handle: "@Hidabroot_co_il", title: "הידברות", notes: "תוכן כללי — רוב בחרדי, יש דתי-לאומי", priority: 3, trusted: false },
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
          trusted: seed.trusted ?? false,
        } as any,
      });
      console.log(`   🔄 עודכן${seed.trusted ? " 🛡️ מהימן" : ""}`);
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
          trusted: seed.trusted ?? false,
        } as any,
      });
      console.log(`   ✨ נוצר${seed.trusted ? " 🛡️ מהימן" : ""}`);
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
