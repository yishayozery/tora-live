import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — תרומות של המשתמש המחובר (לפי donorEmail)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const donations = await db.donation.findMany({
    where: { donorEmail: session.user.email },
    orderBy: { createdAt: "desc" },
  });

  const result = donations.map((d) => ({
    id: d.id,
    amount: d.amount,
    donorName: d.donorName,
    dedicationName: d.dedicationName,
    dedicationType: d.dedicationType,
    receiptSent: d.receiptSent,
    createdAt: d.createdAt,
  }));

  return NextResponse.json(result);
}
