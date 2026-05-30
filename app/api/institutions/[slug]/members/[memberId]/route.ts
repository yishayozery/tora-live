// הסרת חבר מהמוסד — רכז בלבד. רכז לא יכול להסיר את עצמו.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRakazOf } from "@/lib/institution";

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const institution = await db.institution.findUnique({ where: { slug: params.slug } });
  if (!institution) {
    return NextResponse.json({ error: "מוסד לא נמצא" }, { status: 404 });
  }
  if (!(await isRakazOf(session.user.id, institution.id, session.user.email))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const member = await db.institutionMember.findUnique({ where: { id: params.memberId } });
  if (!member || member.institutionId !== institution.id) {
    return NextResponse.json({ error: "חבר לא נמצא" }, { status: 404 });
  }

  if (member.userId === session.user.id) {
    return NextResponse.json({ error: "לא ניתן להסיר את עצמך" }, { status: 400 });
  }

  await db.institutionMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}
