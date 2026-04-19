/**
 * הוספת suggestion ידנית מ-URL חיצוני (פייסבוק, אינסטגרם, אתר וכו').
 * שולף Open Graph tags מהדף ויוצר LessonSuggestion.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { saveSuggestion } from "@/lib/social-scout";

const schema = z.object({
  url: z.string().url(),
  // אופציונלי — אם אדמין רוצה לעקוף את ה-OG ולמלא ידנית
  title: z.string().min(3).max(300).optional(),
  rabbiName: z.string().max(200).optional(),
  scheduledAt: z.string().optional(),
  durationMin: z.number().int().min(5).max(720).optional(),
  locationName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

function detectSourceType(url: string): "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "OTHER" {
  if (/facebook\.com|fb\.me/.test(url)) return "FACEBOOK";
  if (/instagram\.com/.test(url)) return "INSTAGRAM";
  if (/twitter\.com|x\.com/.test(url)) return "TWITTER";
  return "OTHER";
}

/** שלוף Open Graph tags מ-HTML */
function parseOpenGraph(html: string): { title?: string; description?: string; image?: string; siteName?: string } {
  const get = (prop: string) => {
    const re = new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, "i");
    const m = html.match(re) || html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${prop}["']`, "i"));
    return m?.[1];
  };
  return {
    title: get("og:title") || get("twitter:title"),
    description: get("og:description") || get("twitter:description") || get("description"),
    image: get("og:image") || get("twitter:image"),
    siteName: get("og:site_name"),
  };
}

export async function POST(req: Request) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const sourceType = detectSourceType(data.url);

  // נסה לשלוף OG tags
  let og: ReturnType<typeof parseOpenGraph> = {};
  let rawHtml = "";
  try {
    const res = await fetch(data.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TORA_LIVE-bot/1.0; +https://tora-live.co.il)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      rawHtml = (await res.text()).slice(0, 100_000);
      og = parseOpenGraph(rawHtml);
    }
  } catch (e: any) {
    // לא נכשל — נשתמש בנתונים שהאדמין סיפק
  }

  const title = data.title ?? og.title ?? data.url;
  const description = (data.notes ? `📝 ${data.notes}\n\n` : "") + (og.description ?? "");

  const status = await saveSuggestion({
    title,
    description,
    rabbiName: data.rabbiName,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    durationMin: data.durationMin,
    locationName: data.locationName,
    url: data.url,
    posterUrl: og.image,
    source: `manual:${sourceType.toLowerCase()}`,
    sourceType,
    rawContent: rawHtml ? `OG: ${og.title} — ${og.description}` : data.notes,
    confidence: data.scheduledAt ? "HIGH" : og.title ? "MEDIUM" : "LOW",
  });

  if (status === "duplicate") {
    return NextResponse.json({ error: "ה-URL הזה כבר קיים במערכת" }, { status: 409 });
  }
  if (status === "skipped") {
    return NextResponse.json({ error: "חסרים נתונים בסיסיים" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    fetched: !!og.title,
    og: { title: og.title, description: og.description, image: og.image },
  });
}
