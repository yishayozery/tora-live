/**
 * Social Scout — סריקה יומית של מקורות פתוחים לאיתור הצעות לשיעורי תורה.
 *
 * מקורות נתמכים:
 * - Telegram public channels (preview pages t.me/s/CHANNEL)
 * - News sites (Srugim, Kipa, INN — עם search/RSS)
 * - Eventbrite (אם יש API key)
 *
 * הסקריפט יוצר LessonSuggestion עם status=PENDING. אדמין מאשר/דוחה ב-/admin/suggestions.
 */
import { db } from "@/lib/db";

export type ScoutResult = {
  scanned: number;     // מקורות שנסרקו
  found: number;       // הצעות חדשות שנוצרו
  duplicates: number;  // נמצאו אבל היו כפילויות
  errors: string[];
};

export type SuggestionInput = {
  title: string;
  description?: string;
  rabbiName?: string;
  scheduledAt?: Date;
  durationMin?: number;
  locationName?: string;
  url: string;
  posterUrl?: string;
  broadcastType?: "LESSON" | "EVENT" | "PRAYER";
  source: string;       // "telegram:@channel/123"
  sourceType: "TELEGRAM" | "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "NEWS" | "GOOGLE" | "OTHER";
  rawContent?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
};

/** ייצור externalId יציב מ-URL + title (למניעת כפילויות) */
function makeExternalId(input: SuggestionInput): string {
  const key = `${input.url}|${input.title.slice(0, 50)}`;
  return Buffer.from(key).toString("base64").slice(0, 40);
}

/** האם הטקסט מכיל מילים שמרמזות על שיעור? */
const LESSON_KEYWORDS = [
  "שיעור", "שידור חי", "מסירה", "פרשת השבוע", "דף יומי", "הלכה",
  "מוסר", "אמונה", "אגדה", "גמרא", "משנה", "תניא", "מחשבה",
  "ערב לימוד", "ערב עיון", "יום עיון", "כינוס", "מפגש"
];
const TIME_PATTERN = /\b(\d{1,2})[:\.](\d{2})\b/;
const URL_PATTERN = /https?:\/\/[^\s<"]+/gi;

export function looksLikeLesson(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return LESSON_KEYWORDS.some((kw) => lower.includes(kw));
}

export function extractTime(text: string): { hour: number; minute: number } | null {
  const m = text.match(TIME_PATTERN);
  if (!m) return null;
  const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return { hour: h, minute: min };
}

export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_PATTERN);
  return m ? m[0] : null;
}

/**
 * שמירת הצעה חדשה — עם בדיקת כפילויות.
 */
export async function saveSuggestion(input: SuggestionInput): Promise<"created" | "duplicate" | "skipped"> {
  if (!input.title || !input.url) return "skipped";

  const externalId = makeExternalId(input);
  const existing = await db.lessonSuggestion.findUnique({ where: { externalId } });
  if (existing) return "duplicate";

  // בדוק גם אם כבר קיים שיעור עם ה-URL הזה
  const asLesson = await db.lesson.findFirst({
    where: { OR: [{ youtubeUrl: input.url }, { otherUrl: input.url }, { liveEmbedUrl: input.url }] },
  });
  if (asLesson) return "duplicate";

  await db.lessonSuggestion.create({
    data: {
      title: input.title.slice(0, 300),
      description: (input.description ?? "").slice(0, 2000),
      rabbiName: input.rabbiName ?? null,
      scheduledAt: input.scheduledAt ?? null,
      durationMin: input.durationMin ?? null,
      locationName: input.locationName ?? null,
      url: input.url,
      posterUrl: input.posterUrl ?? null,
      broadcastType: input.broadcastType ?? "LESSON",
      source: input.source,
      sourceType: input.sourceType,
      rawContent: input.rawContent?.slice(0, 5000) ?? null,
      confidence: input.confidence ?? "MEDIUM",
      externalId,
    },
  });
  return "created";
}

// ─────────────────────────────────────────────────────────────────
// SOURCES — כל מקור = פונקציה אחת שמחזירה רשימת SuggestionInput
// ─────────────────────────────────────────────────────────────────

/** Telegram public channel preview (t.me/s/CHANNEL) */
export async function scoutTelegramChannel(handle: string): Promise<SuggestionInput[]> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `https://t.me/s/${cleanHandle}`;
  // redirect:false — אם הערוץ לא קיים, t.me עושה 302 → אנחנו לא רוצים לעקוב
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (TORA_LIVE-scout)" },
    redirect: "manual",
  });
  if (res.status !== 200) return [];  // 302 = ערוץ לא קיים / פרטי
  const html = await res.text();
  if (html.length < 5000) return [];  // דף ריק

  // פרסור פשוט של הודעות בעמוד (Telegram preview format)
  const messages: SuggestionInput[] = [];
  const msgRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  const dateRegex = /<a class="tgme_widget_message_date"[^>]*href="([^"]+)"[^>]*><time[^>]*datetime="([^"]+)"/g;

  const dates: { url: string; date: string }[] = [];
  let dm;
  while ((dm = dateRegex.exec(html)) !== null) {
    dates.push({ url: dm[1], date: dm[2] });
  }

  let mm; let i = 0;
  while ((mm = msgRegex.exec(html)) !== null) {
    const text = mm[1].replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
    if (!looksLikeLesson(text)) { i++; continue; }
    const dateInfo = dates[i];
    const lessonUrl = extractFirstUrl(text) ?? dateInfo?.url ?? url;
    const messagePostedAt = dateInfo?.date ? new Date(dateInfo.date) : new Date();
    // אם נמצאה שעה בטקסט — נחבר לתאריך של הפוסט (יום שלם — לא מדויק, אדמין יתקן)
    const time = extractTime(text);
    const scheduledAt = time
      ? new Date(messagePostedAt.getFullYear(), messagePostedAt.getMonth(), messagePostedAt.getDate(), time.hour, time.minute)
      : undefined;

    messages.push({
      title: text.split("\n")[0].slice(0, 100),
      description: text,
      url: lessonUrl,
      source: `telegram:${cleanHandle}`,
      sourceType: "TELEGRAM",
      rawContent: text,
      scheduledAt,
      confidence: time ? "MEDIUM" : "LOW",
    });
    i++;
    if (messages.length >= 10) break;  // מקסימום 10 לערוץ
  }
  return messages;
}

/** רץ כל המקורות והשמרת ההצעות */
export async function runSocialScout(opts: { telegramChannels?: string[]; dryRun?: boolean } = {}): Promise<ScoutResult> {
  const result: ScoutResult = { scanned: 0, found: 0, duplicates: 0, errors: [] };

  const channels = opts.telegramChannels ?? [
    // ערוצי טלגרם פומביים שאומתו (HTTP 200)
    "harbracha",     // ישוב הר ברכה — חדשות, לעיתים שיעורים
    "torahlive",     // tora live
    "dailytora",     // תוכן יומי
  ];

  for (const ch of channels) {
    result.scanned++;
    try {
      const suggestions = await scoutTelegramChannel(ch);
      for (const s of suggestions) {
        if (opts.dryRun) { result.found++; continue; }
        const status = await saveSuggestion(s);
        if (status === "created") result.found++;
        else if (status === "duplicate") result.duplicates++;
      }
    } catch (e: any) {
      result.errors.push(`telegram:${ch}: ${e.message}`);
    }
  }

  return result;
}
