// Cron יומי — סורק רשתות חברתיות לאיתור הצעות לשיעורים.
// Vercel Cron יומי. רץ ב-04:00 בלילה (אחרי discover-lessons).

import { NextResponse } from "next/server";
import { runSocialScout } from "@/lib/social-scout";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSocialScout({});
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
