/**
 * בודק את המצב של live-input ב-Cloudflare בזמן אמת.
 * Usage:
 *   node --env-file=.env --import tsx scripts/check-stream-status.ts <streamId>
 * אם לא מצוין streamId — בודק את כל ה-lessons עם isLive=true.
 *
 * הסקריפט מבצע 5 polls במרווח של 5 שניות (סה"כ ~25 שניות), כדי לזהות
 * שינוי state (idle→connected→connected עם video רץ).
 */
import { db } from "@/lib/db";

async function fetchLiveInput(streamId: string) {
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  if (!acct || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID / TOKEN חסרים ב-env");

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/stream/live_inputs/${streamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`CF API: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

async function fetchVideos(streamId: string) {
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/stream/live_inputs/${streamId}/videos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return Array.isArray(json.result) ? json.result : [];
}

async function main() {
  let streamId = process.argv[2];

  if (!streamId) {
    const live = await db.lesson.findMany({
      where: { isLive: true, streamId: { not: null } },
      select: { id: true, title: true, streamId: true },
    });
    if (live.length === 0) {
      console.log("❌ אין שיעורים במצב isLive=true ב-DB.");
      console.log("אם מצב הסטריימר מציג 'שידור פעיל' אבל ה-DB לא יודע — ה-PATCH /live נכשל. בדוק Vercel logs.");
      return;
    }
    if (live.length > 1) {
      console.log("יש מספר שיעורים live — בודק את הראשון:");
      live.forEach((l) => console.log(`  ${l.streamId}  ${l.title}`));
    }
    streamId = live[0].streamId!;
    console.log(`\n🔍 בודק streamId: ${streamId}\n`);
  }

  console.log("מבצע 5 בדיקות במרווח של 5 שניות:\n");
  for (let i = 1; i <= 5; i++) {
    try {
      const li = await fetchLiveInput(streamId);
      const state = li.status?.current?.state ?? "unknown";
      const ingressIP = li.status?.current?.ingest?.host ?? null;
      const videos = await fetchVideos(streamId);
      const livePlayback = videos.find((v: any) => v.live);
      const livePlaybackId = livePlayback?.preview ?? livePlayback?.playback?.hls ?? null;

      console.log(`#${i} state=${state} | videos=${videos.length} | live-video=${livePlayback ? "yes" : "no"} | ingest-host=${ingressIP || "—"}`);
      if (livePlayback) {
        console.log(`     HLS: ${livePlayback.playback?.hls || livePlayback.preview || "n/a"}`);
        console.log(`     status: ${livePlayback.status?.state || "n/a"}, pctComplete: ${livePlayback.status?.pctComplete ?? "n/a"}`);
      }
    } catch (e: any) {
      console.log(`#${i} ERROR: ${e.message}`);
    }
    if (i < 5) await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("\n=== פירוש ===");
  console.log("state=connected או reconnected = ה-WHIP מצליח להגיע ל-CF");
  console.log("state=idle/disconnected = שום video לא מגיע ל-CF (בעיה בצד הדפדפן)");
  console.log("יש 'live-video' = CF יוצר נתוני HLS לצופים — אם לא, גם state=connected אומר 'WHIP מחובר אבל אין מדיה אמיתית'");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
