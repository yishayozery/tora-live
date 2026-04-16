// Cloudflare Stream Live API integration
// Docs: https://developers.cloudflare.com/stream/stream-live/

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const CF_TOKEN = process.env.CLOUDFLARE_STREAM_TOKEN ?? "";
const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream`;

async function cfFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${CF_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) {
    console.error("[cf-stream]", json.errors);
    throw new Error(json.errors?.[0]?.message || "Cloudflare Stream API error");
  }
  return json.result;
}

export type LiveInput = {
  uid: string;
  rtmps: { url: string; streamKey: string };
  webRTC: { url: string }; // WHIP endpoint for browser streaming
  srt: { url: string; streamId: string };
  meta: { name: string };
  recording: { mode: string };
  status: { current: { state: string } } | null;
};

/**
 * יצירת Live Input חדש.
 * @returns LiveInput עם RTMP/WHIP/SRT endpoints + recording
 */
export async function createLiveInput(name: string): Promise<LiveInput> {
  if (!CF_ACCOUNT || !CF_TOKEN) {
    // Stub — כשאין credentials, מחזיר mock
    console.warn("[cf-stream] No credentials — returning stub live input");
    const fakeId = `stub_${Date.now().toString(36)}`;
    return {
      uid: fakeId,
      rtmps: { url: "rtmps://live.cloudflare.com:443/live/", streamKey: fakeId },
      webRTC: { url: `https://customer-stub.cloudflarestream.com/${fakeId}/webRTC/publish` },
      srt: { url: `srt://live.cloudflare.com:778`, streamId: fakeId },
      meta: { name },
      recording: { mode: "automatic" },
      status: null,
    };
  }

  return cfFetch("/live_inputs", {
    method: "POST",
    body: JSON.stringify({
      meta: { name },
      recording: { mode: "automatic", timeoutSeconds: 300 }, // auto-stop after 5 min silence
      deleteRecordingAfterDays: 5,
    }),
  });
}

/**
 * מידע על Live Input קיים.
 */
export async function getLiveInput(inputId: string): Promise<LiveInput | null> {
  if (!CF_ACCOUNT || !CF_TOKEN) return null;
  try {
    return await cfFetch(`/live_inputs/${inputId}`);
  } catch {
    return null;
  }
}

/**
 * קבלת ה-playback URL (HLS) מ-live input.
 */
export function getPlaybackUrl(inputId: string): string {
  if (inputId.startsWith("stub_")) {
    return ""; // stub — אין playback אמיתי
  }
  return `https://customer-${CF_ACCOUNT}.cloudflarestream.com/${inputId}/manifest/video.m3u8`;
}

/**
 * קבלת ה-iframe embed URL.
 */
export function getEmbedUrl(inputId: string): string {
  if (inputId.startsWith("stub_")) return "";
  return `https://customer-${CF_ACCOUNT}.cloudflarestream.com/${inputId}/iframe`;
}

/**
 * מחיקת Live Input (וכל ההקלטות שלו).
 */
export async function deleteLiveInput(inputId: string): Promise<void> {
  if (!CF_ACCOUNT || !CF_TOKEN) return;
  await cfFetch(`/live_inputs/${inputId}`, { method: "DELETE" });
}

/**
 * רשימת הקלטות (videos) שנוצרו מ-live input.
 */
export async function getRecordings(inputId: string): Promise<any[]> {
  if (!CF_ACCOUNT || !CF_TOKEN) return [];
  try {
    const result = await cfFetch(`/live_inputs/${inputId}/videos`);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}
