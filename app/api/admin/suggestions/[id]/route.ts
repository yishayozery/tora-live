import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectReason: z.string().max(500).optional(),
  // override fields if admin wants to edit before approving:
  title: z.string().min(3).max(300).optional(),
  rabbiName: z.string().max(200).optional(),
  scheduledAt: z.string().optional(),
  durationMin: z.number().int().min(5).max(720).optional(),
  locationName: z.string().max(200).optional(),
  broadcastType: z.enum(["LESSON", "EVENT", "PRAYER"]).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const sug = await db.lessonSuggestion.findUnique({ where: { id: params.id } });
  if (!sug) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (sug.status !== "PENDING") {
    return NextResponse.json({ error: `כבר טופל (סטטוס: ${sug.status})` }, { status: 400 });
  }

  const data = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tora-live.co.il";
  const admin = await db.user.findUnique({ where: { email: adminEmail } });

  if (data.action === "reject") {
    await db.lessonSuggestion.update({
      where: { id: sug.id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectReason: data.rejectReason ?? null,
      },
    });
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  // approve → צור Lesson חדש
  const title = data.title ?? sug.title;
  const rabbiName = data.rabbiName ?? sug.rabbiName ?? "—";
  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : sug.scheduledAt;
  if (!scheduledAt) {
    return NextResponse.json({ error: "חסר תאריך — ערוך לפני אישור" }, { status: 400 });
  }

  const isYoutube = /youtube\.com|youtu\.be/.test(sug.url);
  const ytIdMatch = sug.url.match(/(?:v=|youtu\.be\/|\/embed\/|\/live\/)([a-zA-Z0-9_-]{11})/);
  const youtubeVideoId = ytIdMatch?.[1];

  const lesson = await db.lesson.create({
    data: {
      title: title.slice(0, 300),
      description: sug.description || title,
      scheduledAt,
      durationMin: data.durationMin ?? sug.durationMin ?? 60,
      broadcastType: data.broadcastType ?? sug.broadcastType,
      isPublic: true,
      approvalStatus: "APPROVED",
      organizerUserId: admin?.id ?? null,
      organizerName: rabbiName,
      locationName: data.locationName ?? sug.locationName ?? null,
      youtubeUrl: isYoutube ? sug.url : null,
      otherUrl: !isYoutube ? sug.url : null,
      liveEmbedUrl: youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null,
      posterUrl: sug.posterUrl ?? null,
      externalId: youtubeVideoId ?? null,
      autoDiscovered: true,
      discoveredAt: new Date(),
    },
  });

  await db.lessonSuggestion.update({
    where: { id: sug.id },
    data: {
      status: "APPROVED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      approvedLessonId: lesson.id,
    },
  });

  return NextResponse.json({ ok: true, action: "approved", lessonId: lesson.id });
}
