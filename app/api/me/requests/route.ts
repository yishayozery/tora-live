import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — התלמיד רואה את כל הפניות שלו
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
  });
  if (!student) {
    return NextResponse.json({ error: "חשבון תלמיד לא נמצא" }, { status: 403 });
  }

  const requests = await db.contactRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      rabbi: { select: { name: true, slug: true } },
    },
  });

  const result = requests.map((r) => ({
    id: r.id,
    rabbiName: r.rabbi.name,
    rabbiSlug: r.rabbi.slug,
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
