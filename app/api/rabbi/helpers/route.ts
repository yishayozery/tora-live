import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";

// PATCH /api/rabbi/helpers — שינוי סטטוס עוזר של עוקב
// body: { followId: string, isStreamHelper: boolean }
const schema = z.object({
  followId: z.string().min(1),
  isStreamHelper: z.boolean(),
});

export async function PATCH(req: Request) {
  const { rabbi } = await requireApprovedRabbi();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // לוודא שהעוקב באמת שייך לרב הזה (אחרת אי אפשר לסמן)
  const follow = await db.follow.findUnique({
    where: { id: parsed.data.followId },
    select: { id: true, rabbiId: true },
  });
  if (!follow || follow.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "עוקב לא נמצא" }, { status: 404 });
  }

  await db.follow.update({
    where: { id: parsed.data.followId },
    data: { isStreamHelper: parsed.data.isStreamHelper } as any,
  });

  return NextResponse.json({ ok: true, isStreamHelper: parsed.data.isStreamHelper });
}
