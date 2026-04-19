// Vercel Cron — יומי, 06:00 Israel time.
// סורק את כל המקורות הפעילים ומוסיף שיעורים חדשים.

import { NextResponse } from "next/server";
import { runDiscovery } from "@/lib/discovery";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDiscovery({});
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
