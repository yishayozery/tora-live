import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";

const updateSchema = z.object({ name: z.string().min(2).max(50) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const cat = await db.category.findFirst({ where: { id: params.id, rabbiId: rabbi.id } });
  if (!cat) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const dup = await db.category.findFirst({
    where: { rabbiId: rabbi.id, name: parsed.data.name.trim(), NOT: { id: params.id } },
  });
  if (dup) return NextResponse.json({ error: "קטגוריה בשם זה כבר קיימת" }, { status: 409 });

  await db.category.update({ where: { id: params.id }, data: { name: parsed.data.name.trim() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const cat = await db.category.findFirst({
    where: { id: params.id, rabbiId: rabbi.id },
    include: { _count: { select: { lessons: true } } },
  });
  if (!cat) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  if (cat._count.lessons > 0) {
    return NextResponse.json(
      { error: `לא ניתן למחוק — יש ${cat._count.lessons} שיעורים בקטגוריה זו` },
      { status: 400 }
    );
  }
  await db.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
