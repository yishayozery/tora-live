/**
 * Fetch upcoming livestreams from YouTube and emit JSON for import-lessons.ts
 */
import { listUpcoming, listLive, getVideos, parseDurationMin, hasHebrew } from "../lib/youtube";

const CHANNELS = [
  { id: "UCY9-4ZMEN5xN96X6XsITzrg", name: "מכון מאיר (FR)" },
  { id: "UC9JkPOLyJA-pridfWBQJtRQ", name: "הר ברכה" },
  { id: "UCkwxRNj-7Iu1LlHJfKzl2Gw", name: "ישיבת הר ברכה" },
  { id: "UCu1CbsrzxegOPv5bomQfJ-g", name: "ערוץ ישיבה" },
  { id: "UCI2e9oh_DKN38PQTf5LowXg", name: "ערוץ 7" },
  { id: "UC6w8w68JXkBfXOm0LfRRRRA", name: "הרב שמואל אליהו" },
];

async function main() {
  const all: any[] = [];
  for (const ch of CHANNELS) {
    try {
      const [up, live] = await Promise.all([
        listUpcoming(ch.id, 25).catch(() => []),
        listLive(ch.id, 5).catch(() => []),
      ]);
      const ids = [...up, ...live];
      console.error(`${ch.name}: ${ids.length} upcoming/live`);
      if (!ids.length) continue;
      const vids = await getVideos(ids);
      for (const v of vids) {
        if (!hasHebrew(v.snippet.title)) continue;
        const live = v.liveStreamingDetails;
        const scheduledAt = live?.scheduledStartTime || live?.actualStartTime || v.snippet.publishedAt;
        all.push({
          title: v.snippet.title,
          rabbi: v.snippet.channelTitle,
          channelName: v.snippet.channelTitle,
          scheduledAt,
          durationMin: parseDurationMin(v.contentDetails?.duration || "PT60M"),
          url: `https://www.youtube.com/watch?v=${v.id}`,
          youtubeVideoId: v.id,
          broadcastType: "LESSON",
          source: `YouTube channel ${ch.name}`,
          confidence: "HIGH",
        });
      }
    } catch (e: any) {
      console.error(`${ch.name}: ERROR ${e.message}`);
    }
  }
  console.log(JSON.stringify(all, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
