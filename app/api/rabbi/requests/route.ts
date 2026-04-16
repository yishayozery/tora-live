import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — רב מקבל את כל הפניות שלו
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const rabbi = await db.rabbi.findUnique({
    where: { userId: session.user.id },
  });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const requests = await db.contactRequest.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { name: true } },
    },
  });

  const result = requests.map((r) => ({
    id: r.id,
    studentName: r.student.name,
    message: r.message,
    reply: r.reply,
    requestType: r.requestType,
    topic: r.topic,
    requestedDate: r.requestedDate,
    requestedTime: r.requestedTime,
    status: r.status,
    createdAt: r.createdAt,
    repliedAt: r.repliedAt,
  }));

  return NextResponse.json(result);
}
