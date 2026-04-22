// Cron לזיהוי מהיר של התחלת/סיום שידור חי + גילוי שידורים חדשים.
// מיועד לרוץ כל 30 דק' דרך GitHub Actions.
//
// עושה 2 דברים:
//   1. detectLiveTransitions — בודק שיעורים שכבר ב-DB שה-scheduledAt בטווח ±30 דק' (זול, ~1 unit/lesson)
//   2. runDiscovery — סורק מקורות שלא נסרקו ב-45 דק' אחרונות (יקר, ~200 units/source)
//      הלוגיקה: סורק רק מקורות "bחסרים" כדי לשמור על quota

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectLiveTransitions, runDiscovery } from "@/lib/discovery";

// מקורות נסרקים לכל היותר פעם ב-X דקות (מניעת מיצוי quota)
const DISCOVERY_INTERVAL_MIN = 45;

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
    transitionsOnly: 0,
    discoveryRuns: 0,
  };

  // === שלב 1: זיהוי מעברים בשיעורים שכבר ידועים ===
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
    result.transitionsOnly++;
    try {
      await detectLiveTransitions(sourceId, result);
    } catch (e: any) {
      result.errors.push(`transitions:${sourceId}: ${e.message}`);
    }
  }

  // === שלב 2: גילוי שידורים חדשים ממקורות שטרם נסרקו לאחרונה ===
  const cutoff = new Date(Date.now() - DISCOVERY_INTERVAL_MIN * 60 * 1000);
  const staleSources = await db.rabbiSource.findMany({
    where: {
      enabled: true,
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: cutoff } },
      ],
    },
    select: { id: true, channelId: true, channelTitle: true },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    take: 10, // הגנה על quota — עד 10 מקורות בסריקה אחת
  });

  for (const source of staleSources) {
    if (result.quotaExhausted) break;
    result.discoveryRuns++;
    try {
      const discoveryResult = await runDiscovery({ channelIdFilter: source.channelId });
      result.newLessons += discoveryResult.newLessons;
      result.updatedLive += discoveryResult.updatedLive;
      result.endedBroadcasts += discoveryResult.endedBroadcasts;
      result.skippedDuplicates += discoveryResult.skippedDuplicates;
      result.skippedFilters += discoveryResult.skippedFilters;
      result.scannedSources += discoveryResult.scannedSources;
      if (discoveryResult.quotaExhausted) result.quotaExhausted = true;
      if (discoveryResult.errors.length > 0) {
        result.errors.push(...discoveryResult.errors.map((e) => `${source.channelTitle}: ${e}`));
      }
    } catch (e: any) {
      result.errors.push(`discovery:${source.channelTitle}: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
