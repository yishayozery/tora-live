/**
 * Lesson Scout — CLI entrypoint.
 *
 * Usage:
 *   tsx scripts/lesson-scout.ts                  # סריקה מלאה
 *   tsx scripts/lesson-scout.ts --dry-run        # בלי שמירה
 *   tsx scripts/lesson-scout.ts --channelId=UCx  # ערוץ ספציפי
 */
import { runDiscovery } from "../lib/discovery";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const channelArg = args.find((a) => a.startsWith("--channelId="));
  const channelIdFilter = channelArg?.split("=")[1];

  console.log("🔍 Lesson Scout — starting", { dryRun, channelIdFilter });
  const t0 = Date.now();

  const result = await runDiscovery({ dryRun, channelIdFilter });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors.length > 0 && !result.quotaExhausted ? 1 : 0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
