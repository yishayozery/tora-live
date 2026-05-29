// עדכון חדר — הדלקת/כיבוי שידור, עריכה, מחיקה. רכז בלבד.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRakazOf, findActiveLessonForRoom } from "@/lib/institution";
import { deleteLiveInput } from "@/lib/stream";

const patchSchema = z.object({
  isBroadcasting: z.boolean().optional(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(200).optional().nullable(),
  activeLessonId: z.string().nullable().optional(),
});

async function authorize(slug: string, userId: string, email?: string | null) {
  const institution = await db.institution.findUnique({ where: { slug } });
  if (!institution) return { error: "מוסד לא נמצא", status: 404 as const };
  if (!(await isRakazOf(userId, institution.id, email))) return { error: "אין הרשאה", status: 403 as const };
  return { institution };
}

export async function PATCH(req: Request, { params }: { params: { slug: string; roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const auth = await authorize(params.slug, session.user.id, session.user.email);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const room = await db.room.findUnique({ where: { id: params.roomId } });
  if (!room || room.institutionId !== auth.institution!.id) {
    return NextResponse.json({ error: "חדר לא נמצא" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const data = parsed.data;

  // כשמדליקים שידור — מנסים לקשר אוטומטית לשיעור הפעיל בחדר.
  let activeLessonId = data.activeLessonId;
  if (data.isBroadcasting === true && activeLessonId === undefined) {
    const active = await findActiveLessonForRoom(room.id);
    activeLessonId = active?.id ?? null;
    // מסמנים את השיעור עצמו כ-live + מקשרים ל-playback של החדר
    if (active && room.playbackUrl) {
      await db.lesson.update({
        where: { id: active.id },
        data: { isLive: true, liveEmbedUrl: room.playbackUrl, liveMethod: "BROWSER", streamId: room.streamInputUid },
      });
    }
  }
  // כשמכבים — מורידים isLive מהשיעור המקושר
  if (data.isBroadcasting === false && room.activeLessonId) {
    await db.lesson.update({
      where: { id: room.activeLessonId },
      data: { isLive: false },
    }).catch(() => {});
  }

  const updated = await db.room.update({
    where: { id: room.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isBroadcasting !== undefined ? { isBroadcasting: data.isBroadcasting } : {}),
      ...(activeLessonId !== undefined ? { activeLessonId } : {}),
    },
  });
  return NextResponse.json({ ok: true, room: updated });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string; roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const auth = await authorize(params.slug, session.user.id, session.user.email);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const room = await db.room.findUnique({ where: { id: params.roomId } });
  if (!room || room.institutionId !== auth.institution!.id) {
    return NextResponse.json({ error: "חדר לא נמצא" }, { status: 404 });
  }

  // מנקים את ה-Live Input ב-Cloudflare כדי לא להשאיר ערוצים יתומים
  if (room.streamInputUid) {
    await deleteLiveInput(room.streamInputUid).catch(() => {});
  }
  await db.room.delete({ where: { id: room.id } });
  return NextResponse.json({ ok: true });
}
