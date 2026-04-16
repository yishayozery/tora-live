import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { createLiveInput, getPlaybackUrl, getEmbedUrl } from "@/lib/stream";

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
      const input = await createLiveInput(`${rabbi.name} — ${lesson.title}`);
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
  const recordingExpiry = new Date(Date.now() + 5 * 24 * 3600000); // 5 ימים

  await db.lesson.update({
    where: { id: params.id },
    data: {
      isLive: false,
      recordingExpiry: lesson.streamId ? recordingExpiry : null,
      // playbackUrl נשאר — ההקלטה זמינה 5 ימים
    },
  });

  return NextResponse.json({ ok: true, isLive: false, recordingExpiry: recordingExpiry.toISOString() });
}
