import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "שם קצר מדי").max(100),
});

export async function PUT(req: Request) {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "לא תלמיד" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await db.student.update({
    where: { id: student.id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ ok: true });
}
