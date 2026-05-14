import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/rabbi/messages/[id] — rabbi-only, delete own message
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }
  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!rabbi) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const msg = await db.rabbiMessage.findUnique({
    where: { id: params.id },
    select: { rabbiId: true },
  });
  if (!msg) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  if (msg.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  await db.rabbiMessage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
