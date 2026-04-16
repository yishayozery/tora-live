import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  await db.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
