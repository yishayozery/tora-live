import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { createLiveInput, getPlaybackUrl, getEmbedUrl, getRecordings } from "@/lib/stream";
import { emitShiurCreated } from "@/lib/events";

const startSchema = z.object({
  isLive: z.boolean(),
  liveMethod: z.enum(["BROWSER", "YOUTUBE", "EXTERNAL"]).optional(),
  liveEmbedUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson || lesson.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { isLive, liveMethod, liveEmbedUrl } = parsed.data;

  // --- התחלת שידור ---
  if (isLive) {
    const method = liveMethod ?? "YOUTUBE";

    if (method === "BROWSER") {
      // שידור מהדפדפן — יצירת Cloudflare Stream Live Input
      // אם Cloudflare מסרב (אין מנוי, טוקן לא תקין וכו') — נחזיר הודעה ברורה ל-UI
      let input;
      try {
        input = await createLiveInput(`${rabbi.name} — ${lesson.title}`);
      } catch (err: any) {
        const msg = err?.message || "";
        let userMsg = `Cloudflare סירב ליצור שידור: ${msg}`;
        if (/subscription/i.test(msg) || /stream.*not.*enabled/i.test(msg)) {
          userMsg = "Cloudflare Stream דורש מנוי בתשלום ($5/חודש). פתח אותו ב-https://dash.cloudflare.com → Stream → Subscribe.";
        } else if (/unauthor/i.test(msg) || /forbidden/i.test(msg) || /401/.test(msg) || /403/.test(msg)) {
          userMsg = "Cloudflare דחה את הטוקן. ודא ש-CLOUDFLARE_STREAM_TOKEN ב-Vercel נכון ויש לו הרשאת Stream:Edit.";
        } else if (/account.*id/i.test(msg)) {
          userMsg = "Cloudflare Account ID חסר/שגוי ב-Vercel.";
        }
        console.error("[live] createLiveInput failed:", msg);
        return NextResponse.json({ error: userMsg, cloudflareError: msg }, { status: 502 });
      }
      const playback = getPlaybackUrl(input.uid);
      const embed = getEmbedUrl(input.uid);

      await db.lesson.update({
        where: { id: params.id },
        data: {
          isLive: true,
          liveMethod: "BROWSER",
          streamId: input.uid,
          playbackUrl: playback,
          liveEmbedUrl: embed || null,
        },
      });

      return NextResponse.json({
        ok: true,
        isLive: true,
        method: "BROWSER",
        streamId: input.uid,
        whipUrl: input.webRTC.url,
        rtmpUrl: input.rtmps.url,
        rtmpKey: input.rtmps.streamKey,
        playbackUrl: playback,
      });
    }

    // YouTube / External — רגיל embed
    await db.lesson.update({
      where: { id: params.id },
      data: {
        isLive: true,
        liveMethod: method,
        liveEmbedUrl: liveEmbedUrl || null,
        streamId: null,
        playbackUrl: null,
      },
    });

    return NextResponse.json({ ok: true, isLive: true, method });
  }

  // --- סיום שידור ---
  // 30 יום — מתאים למה ש-Cloudflare Stream שומר בפועל (deleteRecordingAfterDays=30).
  // ה-cron `cleanup-expired-recordings` יוודא מחיקה בסוף התקופה.
  const recordingExpiry = new Date(Date.now() + 30 * 24 * 3600000);

  // ניסיון מיידי לשלוף את ה-recording video מ-CF. ההקלטה מהזרם הופכת ל-VOD משלה
  // עם UID חדש (שונה מ-live input UID). אם CF עוד לא מוכן (לוקח ~5-15 שניות) — לא קריטי,
  // הקרון הבא או ה-/download endpoint יבצע lookup לפי הצורך.
  let recordingUrl: string | null = lesson.recordingUrl;
  if (lesson.streamId) {
    try {
      const videos = await getRecordings(lesson.streamId);
      if (videos.length > 0) {
        // הוידיאו האחרון ביותר מהזרם
        const latest = videos[0] as any;
        const videoUid = latest.uid || latest.preview;
        if (videoUid) {
          recordingUrl = getPlaybackUrl(videoUid);
        }
      }
    } catch (e) {
      // לא קריטי — נטפל ב-/download endpoint או בקרון
      console.warn("[live-end] could not fetch recording video yet:", e);
    }
  }

  await db.lesson.update({
    where: { id: params.id },
    data: {
      isLive: false,
      recordingExpiry: lesson.streamId ? recordingExpiry : null,
      recordingUrl,
      // playbackUrl נשאר — ההקלטה זמינה 30 יום
    },
  });

  // טריגר ל-side-effects (תמלול, סיכום וכו') רק כשיש הקלטה.
  if (lesson.streamId) {
    await emitShiurCreated({
      lesson: {
        id: lesson.id,
        rabbiId: lesson.rabbiId ?? null,
        title: lesson.title,
        recordingUrl,
      },
    });
  }

  return NextResponse.json({ ok: true, isLive: false, recordingExpiry: recordingExpiry.toISOString(), recordingUrl });
}
