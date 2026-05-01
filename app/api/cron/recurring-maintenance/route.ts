// Cron יומי — תחזוקת שיעורים קבועים.
// 1. מאריך אוטומטית את לוח השיעורים (יוצר חדשים ב-30 יום הבאים)
// 2. שולח התראות מייל לרבנים על חגים שמתנגשים בשבוע הקרוב

import { NextResponse } from "next/server";
import { maintainRecurringTemplates } from "@/lib/recurring-lessons";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await maintainRecurringTemplates();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[recurring-maintenance] failed:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
