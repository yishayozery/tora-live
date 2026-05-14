// Webhook receiver מ-Cloudflare Stream — אירועי live_input (connected/disconnected/idle).
// Docs: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
//
// אבטחה: Cloudflare חותם על ה-body בכותרת `Webhook-Signature` (HMAC-SHA256 עם secret).
// אם ה-env `CLOUDFLARE_STREAM_WEBHOOK_SECRET` חסר — מוכרזת אזהרה ומקבלים כל בקשה (לפיתוח/staging).
// תמיד מחזירים 200 (חוץ מ-401 כשחתימה לא תואמת) כדי שלא ייכנס ל-retry loop של Cloudflare.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { emitShiurCreated } from "@/lib/events";

const eventSchema = z.object({
  // צורות אפשריות שמגיעות מ-Cloudflare
  uid: z.string().optional(),
  input_id: z.string().optional(),
  live_input_uid: z.string().optional(),
  event_type: z.string().optional(),
  status: z
    .object({
      current: z.object({ state: z.string() }).optional(),
    })
    .optional(),
  state: z.string().optional(),
});

type CfEvent = z.infer<typeof eventSchema>;

const END_STATES = new Set(["disconnected", "idle", "stopped", "ended"]);

function extractStreamId(e: CfEvent): string | null {
  return e.uid || e.input_id || e.live_input_uid || null;
}

function extractState(e: CfEvent): string | null {
  return e.state || e.status?.current?.state || e.event_type || null;
}

/**
 * אימות חתימה של Cloudflare Webhook.
 * הפורמט: `time=...,sig1=...` (HMAC-SHA256 hex של `${time}.${body}`).
 */
function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
    }),
  );
  const time = parts["time"];
  const sig = parts["sig1"];
  if (!time || !sig) return false;
  const expected = createHmac("sha256", secret).update(`${time}.${body}`).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sig, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const sigHeader = req.headers.get("webhook-signature");
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;

  if (secret) {
    if (!verifySignature(body, sigHeader, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[cf-webhook] CLOUDFLARE_STREAM_WEBHOOK_SECRET לא מוגדר — מקבל ללא אימות");
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    console.warn("[cf-webhook] body לא JSON תקין");
    return NextResponse.json({ ok: true, ignored: "invalid-json" });
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("[cf-webhook] אירוע לא מוכר:", json);
    return NextResponse.json({ ok: true, ignored: "schema" });
  }

  const event = parsed.data;
  const streamId = extractStreamId(event);
  const state = extractState(event);

  if (!streamId || !state) {
    console.warn("[cf-webhook] חסר streamId/state — מתעלם", event);
    return NextResponse.json({ ok: true, ignored: "no-id-or-state" });
  }

  if (!END_STATES.has(state.toLowerCase())) {
    // אירוע מוכר אך לא מסוג סיום — לוג ו-200.
    return NextResponse.json({ ok: true, state, action: "noop" });
  }

  const lesson = await db.lesson.findFirst({ where: { streamId } });
  if (!lesson) {
    return NextResponse.json({ ok: true, ignored: "no-lesson" });
  }

  if (!lesson.isLive) {
    return NextResponse.json({ ok: true, alreadyClosed: true });
  }

  // 30 יום — תואם למה ש-Cloudflare באמת שומר (deleteRecordingAfterDays=30)
  const recordingExpiry = new Date(Date.now() + 30 * 24 * 3600_000);
  await db.lesson.update({
    where: { id: lesson.id },
    data: { isLive: false, recordingExpiry },
  });

  await emitShiurCreated({
    lesson: {
      id: lesson.id,
      rabbiId: lesson.rabbiId ?? null,
      title: lesson.title,
      recordingUrl: lesson.recordingUrl ?? null,
    },
  });

  return NextResponse.json({ ok: true, closed: lesson.id });
}
