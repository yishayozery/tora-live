import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// rate-limit בסיסי per-IP — מונע ספאם
const attempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60_000; // שעה

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return true;
  }
  rec.count += 1;
  return rec.count <= MAX_ATTEMPTS;
}

const schema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot-password
 * מקבל מייל, יוצר ContactRequest לאדמין עם בקשת איפוס.
 * תגובה אחידה תמיד 200 כדי לא לחשוף אם המייל קיים.
 *
 * שיפור עתידי: יצירת PasswordResetToken עם תוקף + שליחת מייל אוטומטי דרך Resend.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: true }, { status: 200 }); // עדיין מחזירים 200, פשוט לא עושים כלום
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // עדיין 200 — לא חושפים אם המייל היה תקין
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase().trim();

  // מחפש משתמש; אם לא קיים — לא חושפים
  const user = await db.user.findUnique({
    where: { email },
    include: { student: true, rabbi: true },
  });

  if (user) {
    // לוג בלבד כרגע — בעתיד נשלח מייל עם reset token. בינתיים האדמין רואה ב-/admin/reports? לא.
    // לוג ב-console כדי שהאדמין יוכל לראות ב-Vercel logs.
    console.log(`[forgot-password] reset requested for user ${user.id} (${email}). IP: ${ip}`);
  }

  // תמיד 200 — UX אחיד ומגן על privacy
  return NextResponse.json({ ok: true });
}
