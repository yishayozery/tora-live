import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";

const patchSchema = z.object({
  currentPage: z.number().int().positive().max(10000).optional(),
  isLiveFollow: z.boolean().optional(),
});

async function ensureOwned(lessonId: string, sourceId: string, rabbiId: string) {
  const source = await db.lessonSource.findUnique({
    where: { id: sourceId },
    include: { lesson: true },
  });
  if (!source || source.lessonId !== lessonId) return null;
  if (source.lesson.rabbiId !== rabbiId) return null;
  return source;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  const { rabbi } = await requireApprovedRabbi();
  const owned = await ensureOwned(params.id, params.sourceId, rabbi.id);
  if (!owned) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data: { currentPage?: number; isLiveFollow?: boolean } = {};
  if (parsed.data.currentPage !== undefined) {
    if (owned.totalPages && parsed.data.currentPage > owned.totalPages) {
      return NextResponse.json({ error: "עמוד מעבר לטווח" }, { status: 400 });
    }
    data.currentPage = parsed.data.currentPage;
  }
  if (parsed.data.isLiveFollow !== undefined) {
    data.isLiveFollow = parsed.data.isLiveFollow;
  }

  const updated = await db.lessonSource.update({
    where: { id: params.sourceId },
    data,
  });
  return NextResponse.json({ source: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  const { rabbi } = await requireApprovedRabbi();
  const owned = await ensureOwned(params.id, params.sourceId, rabbi.id);
  if (!owned) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  await db.lessonSource.delete({ where: { id: params.sourceId } });
  return NextResponse.json({ ok: true });
}
