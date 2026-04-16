import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — רשימת רבנים שהתלמיד עוקב (id + name) לצורך select בטופס פנייה
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

  const follows = await db.follow.findMany({
    where: { studentId: student.id },
    include: { rabbi: { select: { id: true, name: true } } },
    orderBy: { rabbi: { name: "asc" } },
  });

  const result = follows.map((f) => ({
    id: f.rabbi.id,
    name: f.rabbi.name,
  }));

  return NextResponse.json(result);
}
