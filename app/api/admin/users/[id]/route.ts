import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["block", "unblock"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { userId: params.id },
  });
  if (!student) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (parsed.data.action === "block") {
    await db.student.update({
      where: { id: student.id },
      data: {
        isBlocked: true,
        blockedReason: parsed.data.reason || null,
      },
    });
  } else {
    await db.student.update({
      where: { id: student.id },
      data: { isBlocked: false, blockedReason: null },
    });
  }

  return NextResponse.json({ ok: true });
}
