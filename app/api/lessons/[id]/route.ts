import { NextResponse } from "next/server";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { lessonSchema } from "@/lib/validators";

async function ensureOwn(lessonId: string, rabbiId: string) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.rabbiId !== rabbiId) return null;
  return lesson;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const exists = await ensureOwn(params.id, rabbi.id);
  if (!exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;
  await db.lesson.update({
    where: { id: params.id },
    data: {
      title: d.title,
      description: d.description,
      categoryId: d.categoryId || null,
      scheduledAt: new Date(d.scheduledAt),
      durationMin: d.durationMin,
      language: d.language ?? "he",
      broadcastType: d.broadcastType ?? "LESSON",
      isLive: d.isLive ?? false,
      liveEmbedUrl: d.liveEmbedUrl || null,
      youtubeUrl: d.youtubeUrl || null,
      spotifyUrl: d.spotifyUrl || null,
      applePodcastUrl: d.applePodcastUrl || null,
      soundcloudUrl: d.soundcloudUrl || null,
      otherUrl: d.otherUrl || null,
      sourcesPdfUrl: d.sourcesPdfUrl || null,
      syncToCalendar: d.syncToCalendar ?? false,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const exists = await ensureOwn(params.id, rabbi.id);
  if (!exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  await db.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
