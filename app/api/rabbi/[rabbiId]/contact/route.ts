import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const contactSchema = z.object({
  message: z.string().min(10, "הודעה חייבת להכיל לפחות 10 תווים"),
  requestType: z
    .enum([
      "SINGLE_LESSON",
      "STUDY_DAY",
      "SERIES",
      "WEDDING",
      "BRIT",
      "BAR_MITZVAH",
      "SEFER_TORAH",
      "EVENT",
      "OTHER",
    ])
    .optional(),
  topic: z.string().min(1).optional(),
  requestedDate: z.string().optional(), // ISO date string
  requestedTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין")
    .optional(),
});

// POST — תלמיד שולח פנייה לרב
export async function POST(
  req: NextRequest,
  { params }: { params: { rabbiId: string } }
) {
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
  if (student.isBlocked) {
    return NextResponse.json({ error: "אינך מורשה לשלוח הודעות" }, { status: 403 });
  }

  const rabbi = await db.rabbi.findUnique({ where: { id: params.rabbiId } });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "רב לא נמצא" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // מענה אוטומטי — אם הרב הפעיל, מילוי reply + status=REPLIED
  const r = rabbi as any;
  const useAutoReply =
    r.autoReplyEnabled === true &&
    typeof r.autoReplyMessage === "string" &&
    r.autoReplyMessage.trim().length > 0;

  const request = await db.contactRequest.create({
    data: {
      rabbiId: rabbi.id,
      studentId: student.id,
      message: parsed.data.message,
      requestType: parsed.data.requestType ?? null,
      topic: parsed.data.topic ?? null,
      requestedDate: parsed.data.requestedDate
        ? new Date(parsed.data.requestedDate)
        : null,
      requestedTime: parsed.data.requestedTime ?? null,
      status: useAutoReply ? "REPLIED" : "PENDING",
      reply: useAutoReply ? r.autoReplyMessage.trim() : null,
      repliedAt: useAutoReply ? new Date() : null,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
