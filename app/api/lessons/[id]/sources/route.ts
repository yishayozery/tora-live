import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";

const createSchema = z.object({
  fileUrl: z.string().url("כתובת URL לא תקינה"),
  fileName: z.string().max(200).optional().nullable(),
  totalPages: z.number().int().positive().max(10000).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { rabbi } = await requireApprovedRabbi();
  const lesson = await db.lesson.findUnique({ where: { id: params.id } });
  if (!lesson || lesson.rabbiId !== rabbi.id) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const source = await db.lessonSource.create({
    data: {
      lessonId: lesson.id,
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName || null,
      totalPages: parsed.data.totalPages ?? null,
    },
  });
  return NextResponse.json({ source });
}
