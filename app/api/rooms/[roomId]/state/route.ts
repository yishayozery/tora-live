// Endpoint ל-Pi: polling כל 10 שניות — "האם לשדר עכשיו?".
// אימות עם deviceToken (header X-Device-Token). מחזיר RTMP credentials + מצב.
// גם heartbeat — מעדכן lastSeenAt לניטור אופליין.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  const token = req.headers.get("x-device-token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 });

  const room = await db.room.findUnique({ where: { id: params.roomId } });
  if (!room || room.deviceToken !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // heartbeat — מעדכן שהמצלמה חיה
  await db.room.update({
    where: { id: room.id },
    data: { lastSeenAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({
    shouldStream: room.isBroadcasting,
    // ה-Pi כבר יודע את ה-RTMP מ-config, אבל מחזירים ליתר ביטחון
    rtmpUrl: room.rtmpUrl,
    streamKey: room.streamKey,
    roomName: room.name,
  });
}
