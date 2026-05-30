// בדיקות ל-Pi polling endpoint: GET /api/rooms/[id]/state
// אימות עם deviceToken + heartbeat דרך lastSeenAt.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const room = {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  };
  return { db: { room } };
});

import { db } from "@/lib/db";
import { GET } from "@/app/api/rooms/[roomId]/state/route";

function req(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers["x-device-token"] = token;
  return new Request("http://localhost/api/rooms/R1/state", { method: "GET", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/rooms/[roomId]/state — Pi polling", () => {
  it("401 when token header missing", async () => {
    const res = await GET(req(), { params: { roomId: "R1" } });
    expect(res.status).toBe(401);
  });

  it("401 when room not found", async () => {
    (db.room.findUnique as any).mockResolvedValueOnce(null);
    const res = await GET(req("abc"), { params: { roomId: "R1" } });
    expect(res.status).toBe(401);
  });

  it("401 when token mismatch", async () => {
    (db.room.findUnique as any).mockResolvedValueOnce({
      id: "R1",
      deviceToken: "real-token",
      isBroadcasting: false,
      rtmpUrl: "rtmps://...",
      streamKey: "key",
      name: "חדר א",
    });
    const res = await GET(req("wrong-token"), { params: { roomId: "R1" } });
    expect(res.status).toBe(401);
  });

  it("200 + shouldStream=false — returns RTMP creds + updates heartbeat", async () => {
    (db.room.findUnique as any).mockResolvedValueOnce({
      id: "R1",
      deviceToken: "real-token",
      isBroadcasting: false,
      rtmpUrl: "rtmps://live.cloudflare.com:443/live/",
      streamKey: "secretkey",
      name: "חדר א",
    });
    const res = await GET(req("real-token"), { params: { roomId: "R1" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shouldStream).toBe(false);
    expect(data.rtmpUrl).toContain("cloudflare");
    expect(data.streamKey).toBe("secretkey");
    expect(data.roomName).toBe("חדר א");
    // heartbeat נשלח
    expect(db.room.update).toHaveBeenCalledWith({
      where: { id: "R1" },
      data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
    });
  });

  it("200 + shouldStream=true when isBroadcasting=true", async () => {
    (db.room.findUnique as any).mockResolvedValueOnce({
      id: "R1",
      deviceToken: "real-token",
      isBroadcasting: true,
      rtmpUrl: "rtmps://...",
      streamKey: "key",
      name: "חדר ב",
    });
    const res = await GET(req("real-token"), { params: { roomId: "R1" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shouldStream).toBe(true);
  });
});
