/**
 * כלי עזר — פותר @handle או URL ל-channelId.
 * דורש YOUTUBE_API_KEY.
 *
 * Usage:
 *   tsx scripts/resolve-channel-id.ts @machonmeir
 *   tsx scripts/resolve-channel-id.ts "https://www.youtube.com/@harbracha"
 */
async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: tsx scripts/resolve-channel-id.ts <@handle|url>");
    process.exit(1);
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.error("❌ YOUTUBE_API_KEY חסר ב-env");
    process.exit(1);
  }

  // חלץ handle
  let handle = input.trim();
  const m = handle.match(/@([a-zA-Z0-9_.-]+)/);
  if (m) handle = m[1];
  else if (handle.includes("/")) {
    console.error("❌ לא מצא @handle. הזן @handle או URL שמכיל @");
    process.exit(1);
  }

  // Search API
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", `@${handle}`);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`❌ ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const data: any = await res.json();
  if (!data.items?.length) {
    console.log(`❌ לא נמצא ערוץ ל-@${handle}`);
    process.exit(1);
  }

  console.log(`\n🔍 תוצאות חיפוש ל-@${handle}:\n`);
  for (const item of data.items) {
    console.log(`  • ${item.snippet.title}`);
    console.log(`    channelId: ${item.snippet.channelId}`);
    console.log(`    URL:       https://www.youtube.com/channel/${item.snippet.channelId}`);
    console.log(`    תיאור:     ${(item.snippet.description || "").slice(0, 80)}`);
    console.log("");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
