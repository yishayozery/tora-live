import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["dismiss", "removeLesson"]),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });
  }

  const report = await db.report.findUnique({ where: { id: params.id } });
  if (!report) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (parsed.data.action === "removeLesson" && report.lessonId) {
    await db.lesson.delete({ where: { id: report.lessonId } }).catch(() => null);
  }

  await db.report.update({
    where: { id: params.id },
    data: { status: "RESOLVED" },
  });

  return NextResponse.json({ ok: true });
}
