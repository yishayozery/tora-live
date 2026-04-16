import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  notifyChannel: z.enum(["NONE", "EMAIL", "WHATSAPP", "BOTH"]),
  phoneE164: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "מספר טלפון חייב להיות בפורמט בינלאומי, לדוגמה +972501234567")
    .optional()
    .or(z.literal("")),
});

export async function PUT(req: Request) {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "לא תלמיד" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { notifyChannel, phoneE164 } = parsed.data;
  if ((notifyChannel === "WHATSAPP" || notifyChannel === "BOTH") && !phoneE164) {
    return NextResponse.json({ error: "לקבלת וואטסאפ חובה להזין מספר טלפון" }, { status: 400 });
  }

  await db.student.update({
    where: { id: student.id },
    data: { notifyChannel, phoneE164: phoneE164 || null },
  });
  return NextResponse.json({ ok: true });
}
