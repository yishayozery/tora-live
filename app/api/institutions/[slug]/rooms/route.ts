// ניהול חדרים של מוסד — יצירה (כולל Cloudflare Live Input קבוע) + רשימה. רכז בלבד.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRakazOf, provisionRoom } from "@/lib/institution";

const schema = z.object({
  name: z.string().min(1, "שם חדר חסר").max(80),
  description: z.string().max(200).optional().or(z.literal("")),
});

const MAX_ROOMS_PER_INSTITUTION = 10; // safety cap (המודל מעריך עד 5)

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const institution = await db.institution.findUnique({ where: { slug: params.slug } });
  if (!institution) return NextResponse.json({ error: "מוסד לא נמצא" }, { status: 404 });

  if (!(await isRakazOf(session.user.id, institution.id, session.user.email))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const count = await db.room.count({ where: { institutionId: institution.id } });
  if (count >= MAX_ROOMS_PER_INSTITUTION) {
    return NextResponse.json({ error: `הגעת למקסימום ${MAX_ROOMS_PER_INSTITUTION} חדרים` }, { status: 400 });
  }

  try {
    const room = await provisionRoom({
      institutionId: institution.id,
      institutionName: institution.name,
      name: parsed.data.name,
      description: parsed.data.description || undefined,
    });
    return NextResponse.json({
      ok: true,
      id: room.id,
      name: room.name,
      rtmpUrl: room.rtmpUrl,
      streamKey: room.streamKey,
      playbackUrl: room.playbackUrl,
    });
  } catch (err: any) {
    const msg = err?.message || "";
    let userMsg = `שגיאה ביצירת ערוץ השידור: ${msg}`;
    if (/subscription/i.test(msg) || /stream.*not.*enabled/i.test(msg)) {
      userMsg = "Cloudflare Stream דורש מנוי בתשלום. פנה לאדמין.";
    }
    return NextResponse.json({ error: userMsg }, { status: 502 });
  }
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const institution = await db.institution.findUnique({ where: { slug: params.slug } });
  if (!institution) return NextResponse.json({ error: "מוסד לא נמצא" }, { status: 404 });
  if (!(await isRakazOf(session.user.id, institution.id, session.user.email))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const rooms = await db.room.findMany({
    where: { institutionId: institution.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rooms);
}
