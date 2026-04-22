/**
 * מזהה פלטפורמת embed לפי URL ומחזיר URL מתאים ל-iframe.
 * תומך: YouTube, Facebook Live/Video, Twitch (לעתיד).
 */

export type EmbedPlatform = "youtube" | "facebook" | "twitch" | "other" | null;

export function detectEmbedPlatform(url?: string | null): EmbedPlatform {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/facebook\.com|fb\.watch/.test(url)) return "facebook";
  if (/twitch\.tv/.test(url)) return "twitch";
  return "other";
}

/**
 * ממיר URL רגיל (לא-iframe) ל-URL של iframe embed.
 * אם כבר URL של embed — מחזיר אותו כמו שהוא.
 */
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const platform = detectEmbedPlatform(url);

  if (platform === "youtube") {
    // מצב 1: כבר embed
    if (/youtube\.com\/embed\//.test(url)) return url;
    // מצב 2: watch?v=ID
    const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    // מצב 3: youtu.be/ID
    const s = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (s) return `https://www.youtube.com/embed/${s[1]}`;
    // מצב 4: live/ID
    const l = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
    if (l) return `https://www.youtube.com/embed/${l[1]}`;
    return null;
  }

  if (platform === "facebook") {
    // Facebook plugin embed — חוקי ומאושר ע״י Meta
    // דוגמה: https://www.facebook.com/plugins/video.php?href=<encoded-fb-url>&show_text=false&width=560
    if (/facebook\.com\/plugins\/video/.test(url)) return url;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&t=0`;
  }

  return null;
}

/**
 * Aspect ratio תקני לפלטפורמה (padding-bottom).
 */
export function embedAspectRatio(platform: EmbedPlatform): string {
  // Default 16:9
  return "56.25%";
}

/**
 * האם ה-URL תומך ב-iframe embed?
 */
export function isEmbeddable(url?: string | null): boolean {
  if (!url) return false;
  const p = detectEmbedPlatform(url);
  return p === "youtube" || p === "facebook" || p === "twitch";
}
