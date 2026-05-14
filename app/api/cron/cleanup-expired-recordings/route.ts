// Cron — ניקוי הקלטות שפג תוקפן (recordingExpiry < now).
// מוחק את ה-live input מ-Cloudflare ומאפס את שדות ה-DB.
// לוז: כל 6 שעות (vercel.json).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteLiveInput } from "@/lib/stream";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const rows = await db.lesson.findMany({
    where: {
      recordingExpiry: { lt: now, not: null },
      streamId: { not: null },
    },
    select: { id: true, streamId: true },
  });

  const errors: Array<{ id: string; error: string }> = [];
  let cleaned = 0;

  for (const row of rows) {
    try {
      if (row.streamId) {
        await deleteLiveInput(row.streamId);
      }
      await db.lesson.update({
        where: { id: row.id },
        data: {
          streamId: null,
          playbackUrl: null,
          recordingUrl: null,
          recordingExpiry: null,
        },
      });
      cleaned += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ id: row.id, error: msg });
      console.error("[cleanup-expired] שגיאה בשיעור", row.id, msg);
    }
  }

  return NextResponse.json({ ok: true, cleaned, errors });
}
