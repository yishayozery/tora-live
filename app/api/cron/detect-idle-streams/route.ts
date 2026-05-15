/**
 * Cron — מזהה שיעורים שמסומנים isLive=true אבל Cloudflare מדווח שהזרם idle/disconnected.
 * נקרא כל ~10 דקות (מוגבל ב-Vercel Hobby ל-daily, אבל אפשר להריץ ידני בלינק עם CRON_SECRET).
 *
 * תהליך:
 *  1. למצוא את כל ה-lessons עם isLive=true & liveMethod=BROWSER & streamId
 *  2. שאילתה ל-Cloudflare על כל אחד — getLiveInput()
 *  3. אם state != "live" → עדכון isLive=false וקביעת recordingExpiry
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveInput } from "@/lib/stream";
import { emitShiurCreated } from "@/lib/events";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lessons = await db.lesson.findMany({
    where: {
      isLive: true,
      liveMethod: "BROWSER",
      streamId: { not: null },
    },
    select: {
      id: true,
      title: true,
      rabbiId: true,
      streamId: true,
      updatedAt: true,
      recordingUrl: true,
    },
  });

  const results: Array<{ id: string; action: string; reason?: string }> = [];

  for (const l of lessons) {
    if (!l.streamId) continue;
    try {
      const cf = await getLiveInput(l.streamId);
      const cfState = cf?.status?.current?.state ?? "unknown";
      // CF states: "connected", "disconnected", "idle", "reconnected", "unknown"
      const isStillLive = cfState === "connected" || cfState === "reconnected";

      if (!isStillLive) {
        // לא שודר ב-Cloudflare → סגירה אצלנו + recordingExpiry ל-30 יום
        await db.lesson.update({
          where: { id: l.id },
          data: {
            isLive: false,
            recordingExpiry: new Date(Date.now() + 30 * 24 * 3600_000),
          },
        });
        await emitShiurCreated({
          lesson: {
            id: l.id,
            rabbiId: l.rabbiId,
            title: l.title,
            recordingUrl: l.recordingUrl ?? null,
          },
        }).catch(() => {});
        results.push({ id: l.id, action: "ended", reason: `CF state: ${cfState}` });
      } else {
        results.push({ id: l.id, action: "kept" });
      }
    } catch (err: any) {
      results.push({ id: l.id, action: "error", reason: err?.message || "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: lessons.length,
    ended: results.filter((r) => r.action === "ended").length,
    kept: results.filter((r) => r.action === "kept").length,
    errors: results.filter((r) => r.action === "error").length,
    details: results,
  });
}
