import { NextResponse } from "next/server";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { getRecordings } from "@/lib/stream";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson || lesson.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (!lesson.streamId) {
    return NextResponse.json({ recordings: [] });
  }

  const recordings = await getRecordings(lesson.streamId);
  return NextResponse.json({
    recordings: recordings.map((r: any) => ({
      id: r.uid,
      duration: r.duration,
      size: r.size,
      created: r.created,
      playback: r.playback?.hls,
      download: r.playback?.hls?.replace("/manifest/video.m3u8", "/downloads/default.mp4"),
      thumbnail: r.thumbnail,
    })),
    expiresAt: lesson.recordingExpiry?.toISOString() ?? null,
  });
}
