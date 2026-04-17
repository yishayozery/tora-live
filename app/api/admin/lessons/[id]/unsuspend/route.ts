import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

const actionSchema = z.object({
  action: z.enum(["unsuspend", "resetCount"]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const parsed = actionSchema.safeParse(body);
  const action = parsed.success ? parsed.data.action ?? "unsuspend" : "unsuspend";

  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (action === "resetCount") {
    // איפוס מלא — גם ה-Report records מסומנים כ-RESOLVED
    // כדי שהמדווחים יוכלו לדווח שוב אם יש צורך
    await db.$transaction([
      db.lesson.update({
        where: { id: params.id },
        data: { reportCount: 0, isSuspended: false },
      }),
      db.report.updateMany({
        where: { lessonId: params.id, status: "OPEN" },
        data: { status: "RESOLVED" },
      }),
    ]);
  } else {
    await db.lesson.update({
      where: { id: params.id },
      data: { isSuspended: false },
    });
  }

  return NextResponse.json({ ok: true });
}
