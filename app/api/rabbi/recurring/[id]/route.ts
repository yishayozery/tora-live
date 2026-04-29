import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelTemplate, updateTemplate } from "@/lib/recurring-lessons";

const daySchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().nullable().optional(),
  language: z.string().optional(),
  broadcastType: z.string().optional(),
  isPublic: z.boolean().optional(),
  schedule: z.object({
    sun: daySchema, mon: daySchema, tue: daySchema, wed: daySchema,
    thu: daySchema, fri: daySchema, sat: daySchema,
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// DELETE — ביטול סדרת שיעורים (מוחק שיעורים עתידיים שלא נערכו ידנית)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });
  }

  const deleted = await cancelTemplate(params.id, true);
  return NextResponse.json({ ok: true, deletedLessons: deleted });
}

// PATCH — שינוי סטטוס בלבד (PAUSE/RESUME)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (status !== "ACTIVE" && status !== "PAUSED") {
    return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
  }

  await db.recurringLessonTemplate.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json({ ok: true });
}

// PUT — עדכון מלא של תבנית (כולל יצירה מחדש של שיעורים עתידיים)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const template = await db.recurringLessonTemplate.findUnique({ where: { id: params.id } });
  if (!template || template.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "invalid" }, { status: 400 });
  }

  const updates: any = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.categoryId !== undefined) updates.categoryId = parsed.data.categoryId;
  if (parsed.data.language !== undefined) updates.language = parsed.data.language;
  if (parsed.data.broadcastType !== undefined) updates.broadcastType = parsed.data.broadcastType;
  if (parsed.data.isPublic !== undefined) updates.isPublic = parsed.data.isPublic;
  if (parsed.data.schedule !== undefined) {
    // וודא ששבת disabled
    const safe = { ...parsed.data.schedule, sat: { enabled: false } };
    updates.schedule = JSON.stringify(safe);
  }
  if (parsed.data.startDate) updates.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) updates.endDate = new Date(parsed.data.endDate);

  try {
    const result = await updateTemplate(params.id, rabbi.id, updates);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[PUT /api/rabbi/recurring/:id] failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
