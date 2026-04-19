/**
 * Run social-scout manually.
 * Usage:
 *   node --import tsx scripts/run-social-scout.ts
 *   node --import tsx scripts/run-social-scout.ts --channels=yeshivaorg,harbracha
 *   node --import tsx scripts/run-social-scout.ts --dry-run
 */
import { runSocialScout } from "../lib/social-scout";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const channelsArg = args.find((a) => a.startsWith("--channels="));
  const telegramChannels = channelsArg
    ? channelsArg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  console.log(`🔍 Social Scout — starting`, { dryRun, telegramChannels });
  const t0 = Date.now();
  const result = await runSocialScout({ dryRun, telegramChannels });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
