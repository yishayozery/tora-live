// Cron — אוטו-סגירה של שיעורי שידור שנשארו תקועים.
// לוז: כל שעה (Vercel cron — או GitHub Actions אם Vercel Hobby = רק יומי).

import { NextResponse } from "next/server";
import { runAutoClose } from "@/lib/auto-close-lessons";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAutoClose({});
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
