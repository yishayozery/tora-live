import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

const createSchema = z.object({
  platform: z.enum(["YOUTUBE"]).default("YOUTUBE"),
  channelId: z.string().regex(/^UC[a-zA-Z0-9_-]{20,}$/, "channelId לא תקין"),
  channelTitle: z.string().min(1).max(200),
  channelUrl: z.string().url(),
  rabbiName: z.string().max(200).nullable().optional(),
  rabbiId: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "invalid" }, { status: 400 });
  }

  const data = parsed.data;

  // בדוק רב אם סופק
  if (data.rabbiId) {
    const rabbi = await db.rabbi.findUnique({ where: { id: data.rabbiId } });
    if (!rabbi) return NextResponse.json({ error: "רב לא נמצא" }, { status: 400 });
  }

  try {
    const source = await db.rabbiSource.create({
      data: {
        platform: data.platform,
        channelId: data.channelId,
        channelTitle: data.channelTitle,
        channelUrl: data.channelUrl,
        rabbiName: data.rabbiName || null,
        rabbiId: data.rabbiId || null,
        notes: data.notes || null,
      },
    });
    return NextResponse.json({ ok: true, id: source.id });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "הערוץ הזה כבר קיים" }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const sources = await db.rabbiSource.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ sources });
}
