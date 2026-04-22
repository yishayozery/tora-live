import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.trusted === "boolean") data.trusted = body.trusted;
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.rabbiId === "string" || body.rabbiId === null) data.rabbiId = body.rabbiId;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  await db.rabbiSource.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  // שיעורים קיימים — רק ננתק את הקשר (sourceId → null) אבל לא מוחקים
  await db.lesson.updateMany({ where: { sourceId: params.id }, data: { sourceId: null } });
  await db.rabbiSource.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
