import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "block", "unblock"]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });

  const data: any = {};
  switch (parsed.data.action) {
    case "approve":
      data.status = "APPROVED";
      data.isBlocked = false;
      break;
    case "reject":
      data.status = "REJECTED";
      break;
    case "block":
      data.isBlocked = true;
      break;
    case "unblock":
      data.isBlocked = false;
      break;
  }

  await db.rabbi.update({ where: { id: params.id }, data });
  // TODO: לשלוח מייל לרב על שינוי סטטוס
  return NextResponse.json({ ok: true });
}
