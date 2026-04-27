import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLessonsForTemplate } from "@/lib/recurring-lessons";

const daySchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
});

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().default(""),
  categoryId: z.string().nullable().optional(),
  language: z.string().default("he"),
  broadcastType: z.string().default("LESSON"),
  isPublic: z.boolean().default(true),
  schedule: z.object({
    sun: daySchema,
    mon: daySchema,
    tue: daySchema,
    wed: daySchema,
    thu: daySchema,
    fri: daySchema,
    sat: daySchema,
  }),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "invalid" }, { status: 400 });
  }
  const data = parsed.data;

  // ברירת מחדל: התחלה היום, סיום בעוד 6 חודשים
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + 180 * 86400_000);
  endDate.setHours(23, 59, 59, 999);

  // וודא ששבת disabled (כפי שביקש הרב)
  const safeSchedule = { ...data.schedule, sat: { enabled: false } };

  try {
    const template = await db.recurringLessonTemplate.create({
      data: {
        rabbiId: rabbi.id,
        title: data.title,
        description: data.description ?? "",
        categoryId: data.categoryId ?? null,
        language: data.language,
        broadcastType: data.broadcastType,
        isPublic: data.isPublic,
        schedule: JSON.stringify(safeSchedule),
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });

    // יצירת שיעורים מיידית (לכל התקופה)
    const result = await generateLessonsForTemplate(template.id, startDate, endDate);

    return NextResponse.json({
      ok: true,
      templateId: template.id,
      ...result,
    });
  } catch (e: any) {
    console.error("[POST /api/rabbi/recurring] failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — רשימת תבניות פעילות של הרב
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const templates = await db.recurringLessonTemplate.findMany({
    where: { rabbiId: rabbi.id },
    include: { _count: { select: { lessons: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates.map((t) => ({
    id: t.id,
    title: t.title,
    schedule: JSON.parse(t.schedule),
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: t.status,
    isPublic: t.isPublic,
    lessonCount: t._count.lessons,
    createdAt: t.createdAt.toISOString(),
  })));
}
