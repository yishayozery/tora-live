import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

const proposeSchema = z.object({
  title: z.string().min(3, "כותרת קצרה מדי"),
  description: z.string().min(20, "תיאור קצר מדי — לפחות 20 תווים"),
  scheduledAt: z.string().min(1, "חסר תאריך ושעה"),
  locationName: z.string().max(200).optional().or(z.literal("")),
  locationUrl: z.string().url().optional().or(z.literal("")),
  posterUrl: z.string().url().optional().or(z.literal("")),
  liveEmbedUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json().catch(() => null);
  const parsed = proposeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const scheduled = new Date(data.scheduledAt);
  if (isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: "תאריך לא תקין" }, { status: 400 });
  }

  // שולף את שם המציע — רב או תלמיד
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      rabbi: { select: { id: true, name: true, status: true, isBlocked: true } },
      student: { select: { name: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });

  const organizerName = user.rabbi?.name ?? user.student?.name ?? session.user.name ?? "משתמש";

  // רק רב מאושר ולא חסום יקושר כ-rabbiId — אחרת יתויג כמארגן בלבד
  const isApprovedRabbi = user.rabbi && user.rabbi.status === "APPROVED" && !user.rabbi.isBlocked;

  const lesson = await db.lesson.create({
    data: {
      rabbiId: isApprovedRabbi ? (user.rabbi!.id) : null,
      organizerUserId: user.id,
      organizerName,
      title: data.title,
      description: data.description,
      scheduledAt: scheduled,
      locationName: data.locationName || null,
      locationUrl: data.locationUrl || null,
      posterUrl: data.posterUrl || null,
      liveEmbedUrl: data.liveEmbedUrl || null,
      broadcastType: "OTHER",
      isPublic: true,
      approvalStatus: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, id: lesson.id });
}
