// בדיקות ל-API של חדרי מוסד:
// - POST /api/institutions/[slug]/rooms — יצירת חדר (provision CF Live Input)
// - PATCH/DELETE /api/institutions/[slug]/rooms/[roomId] — עדכון/מחיקה
//
// נושאים מרכזיים: auth (רכז בלבד), IDOR (room.institutionId == slug's institution),
// auto-link לשיעור הפעיל בעת התחלת שידור.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks חייבים לפני ה-imports של ה-routes
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db", () => {
  const institution = { findUnique: vi.fn() };
  const room = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const institutionMember = { findUnique: vi.fn() };
  const lesson = {
    findMany: vi.fn(),
    update: vi.fn(async ({ data }) => ({ id: "L1", ...data })),
  };
  return { db: { institution, room, institutionMember, lesson } };
});

vi.mock("@/lib/stream", () => ({
  createLiveInput: vi.fn(async (name: string) => ({
    uid: "cfuid_abc",
    rtmps: { url: "rtmps://live.cloudflare.com:443/live/", streamKey: "secretkey" },
    webRTC: { url: "" },
    srt: { url: "", streamId: "" },
    meta: { name },
    recording: { mode: "automatic" },
    status: null,
  })),
  getPlaybackUrl: vi.fn((uid: string) => `https://customer-X.cloudflarestream.com/${uid}/manifest/video.m3u8`),
  deleteLiveInput: vi.fn(async () => {}),
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as POST_ROOM } from "@/app/api/institutions/[slug]/rooms/route";
import { PATCH as PATCH_ROOM, DELETE as DELETE_ROOM } from "@/app/api/institutions/[slug]/rooms/[roomId]/route";

function makeReq(body?: unknown, method = "POST"): Request {
  return new Request("http://localhost/api/institutions/yeshiva-a/rooms", {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  // resetAllMocks (לא clear) — מנקה גם את התור של mockResolvedValueOnce בין בדיקות,
  // אחרת mock שלא נצרך בבדיקה אחת זולג לבאה ומשבש את הסדר.
  vi.resetAllMocks();
  delete process.env.ADMIN_EMAIL;
});

describe("POST /api/institutions/[slug]/rooms", () => {
  it("401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValueOnce(null);
    const res = await POST_ROOM(makeReq({ name: "חדר א" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(401);
  });

  it("404 when institution not found", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST_ROOM(makeReq({ name: "חדר א" }), { params: { slug: "ghost" } });
    expect(res.status).toBe(404);
  });

  it("403 when user is not a RAKAZ", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1", name: "Y-A" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RABBI" }); // לא רכז
    const res = await POST_ROOM(makeReq({ name: "חדר א" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(403);
  });

  it("403 when user has no membership at all", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1", name: "Y-A" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST_ROOM(makeReq({ name: "חדר א" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(403);
  });

  it("400 when name missing", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1", name: "Y-A" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.count as any).mockResolvedValueOnce(0);
    const res = await POST_ROOM(makeReq({}), { params: { slug: "y-a" } });
    expect(res.status).toBe(400);
  });

  it("400 when room cap reached (10)", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1", name: "Y-A" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.count as any).mockResolvedValueOnce(10);
    const res = await POST_ROOM(makeReq({ name: "חדר 11" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(400);
  });

  it("200 success — creates room, provisions CF input, returns credentials", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1", name: "ישיבת א" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.count as any).mockResolvedValueOnce(0);
    (db.room.create as any).mockImplementationOnce(async ({ data }: any) => ({
      id: "R1",
      ...data,
    }));
    const res = await POST_ROOM(makeReq({ name: "בית מדרש גדול" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.rtmpUrl).toContain("cloudflare");
    expect(data.streamKey).toBe("secretkey");
    expect(data.playbackUrl).toContain("cfuid_abc");
  });
});

describe("PATCH /api/institutions/[slug]/rooms/[roomId]", () => {
  function patchReq(body: any) {
    return new Request("http://localhost/api/institutions/y-a/rooms/R1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("403 when not a rakaz", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RABBI" });
    const res = await PATCH_ROOM(patchReq({ isBroadcasting: true }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(403);
  });

  it("404 when room belongs to a different institution (IDOR prevention)", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.findUnique as any).mockResolvedValueOnce({ id: "R1", institutionId: "I-OTHER" });
    const res = await PATCH_ROOM(patchReq({ isBroadcasting: true }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(404);
  });

  it("200 toggle isBroadcasting=true — auto-links active lesson", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.findUnique as any).mockResolvedValueOnce({
      id: "R1",
      institutionId: "I1",
      streamInputUid: "cfuid_abc",
      playbackUrl: "https://...iframe",
      activeLessonId: null,
    });
    // findActiveLessonForRoom משתמש ב-db.lesson.findMany
    (db.lesson.findMany as any).mockResolvedValueOnce([
      { id: "ACTIVE_L", scheduledAt: new Date(), durationMin: 60, isSuspended: false },
    ]);
    (db.room.update as any).mockImplementationOnce(async ({ data }: any) => ({
      id: "R1",
      institutionId: "I1",
      ...data,
    }));
    const res = await PATCH_ROOM(patchReq({ isBroadcasting: true }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(200);
    expect(db.lesson.update).toHaveBeenCalled(); // השיעור הפעיל סומן כ-isLive
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.room.isBroadcasting).toBe(true);
  });

  it("200 isBroadcasting=false — unmarks active lesson", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.findUnique as any).mockResolvedValueOnce({
      id: "R1",
      institutionId: "I1",
      activeLessonId: "ACTIVE_L",
    });
    (db.room.update as any).mockImplementationOnce(async ({ data }: any) => ({ id: "R1", ...data }));
    const res = await PATCH_ROOM(patchReq({ isBroadcasting: false }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(200);
    expect(db.lesson.update).toHaveBeenCalledWith({
      where: { id: "ACTIVE_L" },
      data: { isLive: false },
    });
  });
});

describe("DELETE /api/institutions/[slug]/rooms/[roomId]", () => {
  it("404 cross-institution (IDOR)", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.findUnique as any).mockResolvedValueOnce({ id: "R1", institutionId: "I-OTHER" });
    const res = await DELETE_ROOM(new Request("http://localhost", { method: "DELETE" }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(404);
  });

  it("200 deletes room + CF input", async () => {
    const { deleteLiveInput } = await import("@/lib/stream");
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "u@x.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.room.findUnique as any).mockResolvedValueOnce({ id: "R1", institutionId: "I1", streamInputUid: "cfuid_abc" });
    (db.room.delete as any).mockResolvedValueOnce({});
    const res = await DELETE_ROOM(new Request("http://localhost", { method: "DELETE" }), { params: { slug: "y-a", roomId: "R1" } });
    expect(res.status).toBe(200);
    expect(deleteLiveInput).toHaveBeenCalledWith("cfuid_abc");
    expect(db.room.delete).toHaveBeenCalledWith({ where: { id: "R1" } });
  });
});
