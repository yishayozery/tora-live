// Cron לזיהוי מהיר של התחלת/סיום שידור חי.
// מיועד לרוץ כל 15 דק' דרך GitHub Actions או cron-job.org (לא Vercel Hobby).
// בודק רק שיעורים שה-scheduledAt שלהם בטווח של ±30 דק' מעכשיו.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectLiveTransitions } from "@/lib/discovery";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = {
    scannedSources: 0,
    newLessons: 0,
    updatedLive: 0,
    endedBroadcasts: 0,
    skippedDuplicates: 0,
    skippedFilters: 0,
    errors: [] as string[],
    quotaExhausted: false,
  };

  // מוצא את המקורות שיש להם שיעור קרוב/חי
  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const sourceIds = await db.lesson.findMany({
    where: {
      sourceId: { not: null },
      scheduledAt: { gte: windowStart, lte: windowEnd },
      OR: [{ isLive: true }, { approvalStatus: "APPROVED" }],
    },
    select: { sourceId: true },
    distinct: ["sourceId"],
  });

  for (const { sourceId } of sourceIds) {
    if (!sourceId) continue;
    result.scannedSources++;
    try {
      await detectLiveTransitions(sourceId, result);
    } catch (e: any) {
      result.errors.push(`${sourceId}: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
