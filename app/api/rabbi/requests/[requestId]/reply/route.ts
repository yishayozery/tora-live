import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyStudent } from "@/lib/notify";

const replySchema = z.object({
  reply: z.string().min(1, "תשובה לא יכולה להיות ריקה"),
});

// POST — רב עונה לפנייה
export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
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

  const contactRequest = await db.contactRequest.findUnique({
    where: { id: params.requestId },
  });
  if (!contactRequest || contactRequest.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "פנייה לא נמצאה" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await db.contactRequest.update({
    where: { id: contactRequest.id },
    data: {
      reply: parsed.data.reply,
      status: "REPLIED",
      repliedAt: new Date(),
    },
  });

  // שליחת התראה לתלמיד
  await notifyStudent({
    studentId: contactRequest.studentId,
    kind: "CONTACT_REPLY" as any,
    title: `תשובה מהרב ${rabbi.name}`,
    body: parsed.data.reply.slice(0, 200),
    link: "/my/requests",
  });

  return NextResponse.json(updated);
}
