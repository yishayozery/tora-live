// Cron — מייצר פוסט יומי, שומר בכל מקום נגיש, ושולח למייל של ה-founder.
// Vercel Hobby cron daily.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { Resend } from "resend";

const SITE = "https://torah-live-rho.vercel.app";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setHours(23, 59, 59, 999);
  const endOfTomorrow = new Date(startOfDay); endOfTomorrow.setDate(endOfTomorrow.getDate() + 2); endOfTomorrow.setHours(0, 0, 0, 0);

  const today = await db.lesson.findMany({
    where: { scheduledAt: { gte: now, lte: endOfDay }, approvalStatus: "APPROVED", isPublic: true, isSuspended: false },
    include: { rabbi: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
  const tomorrow = await db.lesson.findMany({
    where: { scheduledAt: { gte: endOfDay, lte: endOfTomorrow }, approvalStatus: "APPROVED", isPublic: true, isSuspended: false },
    include: { rabbi: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  if (today.length + tomorrow.length < 2) {
    return NextResponse.json({ skipped: true, reason: "too-few-lessons" });
  }

  const rabbiLabel = (l: any) => l.rabbi?.name ?? l.organizerName ?? "רב";
  const whatsappLines: string[] = [`🎓 *שיעורי תורה היום ב-TORA_LIVE*`, ""];
  const live = today.filter((l) => l.isLive);
  if (live.length) {
    whatsappLines.push("🔴 *עכשיו בשידור חי:*");
    for (const l of live.slice(0, 2)) {
      whatsappLines.push(`• ${rabbiLabel(l)} — ${l.title}`);
      whatsappLines.push(`  👈 ${SITE}/lesson/${l.id}`);
    }
    whatsappLines.push("");
  }
  const later = today.filter((l) => !l.isLive).slice(0, 4);
  if (later.length) {
    whatsappLines.push("⏰ *בהמשך היום:*");
    for (const l of later) {
      whatsappLines.push(`• ${formatHebrewTime(l.scheduledAt)} | ${rabbiLabel(l)} — ${l.title}`);
    }
    whatsappLines.push("");
  }
  if (tomorrow.length) {
    whatsappLines.push("🗓️ *מחר:*");
    for (const l of tomorrow.slice(0, 2)) {
      whatsappLines.push(`• ${formatHebrewTime(l.scheduledAt)} | ${rabbiLabel(l)} — ${l.title}`);
    }
    whatsappLines.push("");
  }
  whatsappLines.push("צפייה חינם, ללא הרשמה 👇", SITE);
  const whatsappText = whatsappLines.join("\n");

  // שלח ל-founder במייל
  const founderEmail = process.env.ADMIN_EMAIL;
  if (process.env.RESEND_API_KEY && founderEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME || "TORA_LIVE"} <${process.env.EMAIL_FROM || "noreply@tora-live.co.il"}>`,
        to: founderEmail,
        subject: `📬 פוסט יומי — ${formatHebrewDate(now)}`,
        text: `העתק ל-WhatsApp:\n\n${whatsappText}\n\n---\nנוצר אוטומטית ע"י cron.`,
      });
    } catch (e) { /* swallow */ }
  }

  return NextResponse.json({ ok: true, todayCount: today.length, tomorrowCount: tomorrow.length, whatsapp: whatsappText });
}
