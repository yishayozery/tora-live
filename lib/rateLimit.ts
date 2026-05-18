// Rate limit עם Vercel KV (Upstash Redis) + fallback ל-Map בזיכרון.
// ב-Vercel multi-instance, Map בזיכרון לא הרמטי — כל לאמבדה סופרת לעצמה.
// אם יש KV_REST_API_URL+TOKEN ב-env → משתמשים ב-KV (הרמטי בין instances).
// אם אין → fallback ל-Map (טוב לפיתוח, חלקי בלבד בפרודקשן).
//
// השימוש:
//   const ok = await rateLimit(`upload:${userId}`, 10, 600);
//   if (!ok) return 429;

import { kv } from "@vercel/kv";

const memoryStore = new Map<string, { count: number; firstAt: number }>();

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * בודק האם הפעולה עוברת את מגבלת הקצב.
 *
 * @param key מפתח ייחודי (למשל `upload:userId` או `live-by-code:ip:lessonId`)
 * @param max מקסימום פעולות בחלון הזמן
 * @param windowSeconds חלון הזמן בשניות
 * @returns true אם מותר, false אם נחסם
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (hasKV) {
    try {
      // INCR אטומי ב-Redis — אם זה הראשון בחלון, גם מגדירים TTL.
      const fullKey = `rl:${key}`;
      const count = await kv.incr(fullKey);
      if (count === 1) {
        await kv.expire(fullKey, windowSeconds);
      }
      return count <= max;
    } catch (err) {
      // KV נכשל (network/quota) — נופלים ל-memory כדי לא לחסום משתמשים
      console.warn("[rateLimit] KV failed, falling back to memory:", err);
    }
  }

  // Memory fallback
  const now = Date.now();
  const rec = memoryStore.get(key);
  if (!rec || now - rec.firstAt > windowSeconds * 1000) {
    memoryStore.set(key, { count: 1, firstAt: now });
    return true;
  }
  rec.count += 1;
  return rec.count <= max;
}

/** מחזיר IP של הבקשה — תומך גם ב-Vercel וגם ב-Cloudflare proxy. */
export function getClientIp(req: Request): string {
  return ipFromHeaders(req.headers);
}

/** גרסה שמקבלת Headers ישירות (לשימוש מתוך RSC עם next/headers). */
export function ipFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  );
}
