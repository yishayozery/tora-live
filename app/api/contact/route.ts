import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const contactSchema = z.object({
  name: z.string().min(2, "שם קצר מדי"),
  email: z.string().email("מייל לא תקין"),
  phone: z.string().optional().or(z.literal("")),
  topic: z.string().min(1),
  message: z.string().min(10, "הודעה קצרה מדי — לפחות 10 תווים"),
});

const TOPIC_LABELS: Record<string, string> = {
  general: "שאלה כללית",
  rabbi: "הצטרפות כרב / בעיה בחשבון רב",
  technical: "בעיה טכנית",
  content: "דיווח על תוכן לא הולם",
  donation: "שאלה לגבי תרומה / קבלה",
  partnership: "שיתוף פעולה / מדיה",
};

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "TORA_LIVE";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tora-live.co.il";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email, phone, topic, message } = parsed.data;
  const topicLabel = TOPIC_LABELS[topic] ?? topic;

  // שליחת מייל לאדמין
  if (resend) {
    try {
      await resend.emails.send({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `פנייה חדשה מ-${name} — ${topicLabel}`,
        html: `
<!DOCTYPE html><html dir="rtl" lang="he"><body style="font-family:Arial,sans-serif;background:#F7F8FA;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #E5E7EB;">
    <h2 style="color:#1E40AF;margin:0 0 12px;">פנייה חדשה דרך טופס צור קשר</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px;color:#64748B;width:110px;">שם:</td><td style="padding:6px;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:6px;color:#64748B;">מייל:</td><td style="padding:6px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      ${phone ? `<tr><td style="padding:6px;color:#64748B;">טלפון:</td><td style="padding:6px;">${escapeHtml(phone)}</td></tr>` : ""}
      <tr><td style="padding:6px;color:#64748B;">נושא:</td><td style="padding:6px;">${escapeHtml(topicLabel)}</td></tr>
    </table>
    <div style="margin-top:16px;padding:12px;background:#F7F8FA;border-radius:8px;white-space:pre-line;">${escapeHtml(message)}</div>
  </div>
</body></html>`,
        text: `פנייה חדשה\n\nשם: ${name}\nמייל: ${email}\n${phone ? `טלפון: ${phone}\n` : ""}נושא: ${topicLabel}\n\n${message}`,
      });
    } catch (e) {
      console.error("[contact] email send failed:", e);
      // לא חוסם את המשתמש — הפנייה תישמר בלוג
    }
  } else {
    console.log("[contact stub]", { name, email, phone, topic, message: message.slice(0, 100) });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
