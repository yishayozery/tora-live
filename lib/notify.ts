// שכבת משלוח התראות — מייל ו-וואטסאפ.
// המימושים כאן הם stubs: משאירים פונקציות ברורות שנתחבר אליהן מאוחר יותר
// (Nodemailer / Twilio WhatsApp / WhatsApp Business Cloud API).
//
// כל התראה:
// 1. נכתבת ל-DB (Notification) — תמיד, לצורך In-App.
// 2. נשלחת בערוץ שבחר התלמיד (EMAIL / WHATSAPP / BOTH / NONE).

import { db } from "./db";
import type { Student } from "@prisma/client";
import { Resend } from "resend";

// SQLite mode — enums are strings
type NotificationKind = string;

const SITE_URL = process.env.NEXTAUTH_URL || "https://tora-live.co.il";
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "TORA_LIVE";

type NotifyInput = {
  studentId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string; // יחסי: /rabbi/... /lesson/...
};

export async function notifyStudent(input: NotifyInput) {
  const student = await db.student.findUnique({ where: { id: input.studentId } });
  if (!student || student.isBlocked) return;

  const fullLink = input.link.startsWith("http") ? input.link : `${SITE_URL}${input.link}`;

  const notification = await db.notification.create({
    data: {
      studentId: student.id,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: fullLink,
    },
  });

  const channel = student.notifyChannel;
  if (channel === "NONE") return notification;

  try {
    if (channel === "EMAIL" || channel === "BOTH") {
      await sendEmail(student, input.title, input.body, fullLink);
      await db.notification.update({ where: { id: notification.id }, data: { sentEmail: true } });
    }
    if (channel === "WHATSAPP" || channel === "BOTH") {
      if (student.phoneE164) {
        await sendWhatsApp(student.phoneE164, `*${input.title}*\n\n${input.body}\n\n${fullLink}`);
        await db.notification.update({ where: { id: notification.id }, data: { sentWa: true } });
      }
    }
  } catch (e) {
    console.error("[notify] send failed:", e);
  }

  return notification;
}

// ---------- stubs: להחליף במימוש אמיתי ----------

async function sendEmail(student: Student & { userId: string }, subject: string, text: string, link: string) {
  // מושך את המייל של המשתמש
  const user = await db.user.findUnique({ where: { id: student.userId }, select: { email: true } });
  if (!user?.email) return;

  if (!resend) {
    // Fallback ל-log כשאין RESEND_API_KEY (לדוגמה dev מקומי)
    console.log(`[email → ${user.email}] ${subject}\n${text}\n${link}`);
    return;
  }

  const html = buildHebrewEmailHtml({ title: subject, body: text, link, recipientName: student.name });
  try {
    await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: user.email,
      subject,
      html,
      text: `${text}\n\n${link}`,
    });
  } catch (err) {
    console.error("[resend] send failed:", err);
    throw err;
  }
}

/** תבנית HTML בסיסית RTL עם כפתור הפעולה */
function buildHebrewEmailHtml({
  title, body, link, recipientName,
}: { title: string; body: string; link: string; recipientName: string }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>${escape(title)}</title></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#F7F8FA; margin:0; padding:24px; color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:28px;">
    <div style="border-bottom:1px solid #E5E7EB;padding-bottom:12px;margin-bottom:20px;">
      <span style="font-size:20px;font-weight:bold;color:#1E40AF;">TORA_LIVE</span>
    </div>
    <p style="margin:0 0 6px;color:#64748B;font-size:14px;">שלום ${escape(recipientName)},</p>
    <h2 style="margin:0 0 12px;font-size:22px;color:#0F172A;">${escape(title)}</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;white-space:pre-line;">${escape(body)}</p>
    <a href="${escape(link)}" style="display:inline-block;background:#1E40AF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">לצפייה ←</a>
    <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;border-top:1px solid #E5E7EB;padding-top:16px;">
      קיבלת מייל זה כי אתה רשום ל-TORA_LIVE. להפסקת התראות — כנס להגדרות הפרופיל.
    </p>
  </div>
</body>
</html>`;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function sendWhatsApp(phoneE164: string, message: string) {
  // TODO: Twilio / WhatsApp Business Cloud API.
  // התחבר עם WHATSAPP_TOKEN מ-.env.
  console.log(`[wa → ${phoneE164}] ${message}`);
}
