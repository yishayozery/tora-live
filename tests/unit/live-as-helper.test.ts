import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  return {
    db: {
      lesson: {
        findUnique: vi.fn(),
        update: vi.fn(async ({ data }) => ({ id: "L1", ...data })),
      },
      student: { findUnique: vi.fn() },
      follow: { findUnique: vi.fn() },
    },
  };
});

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { POST } from "@/app/api/lessons/[id]/live-as-helper/route";

const minute = 60_000;

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/lessons/L1/live-as-helper", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function lessonRow(overrides: Partial<any> = {}) {
  return {
    id: "L1",
    rabbiId: "R1",
    scheduledAt: new Date(),
    durationMin: 60,
    prepBeforeMin: null,
    isLive: false,
    isSuspended: false,
    isPublic: true,
    ...overrides,
  };
}

const goodBody = { liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/lessons/[id]/live-as-helper", () => {
  it("401 when not logged in", async () => {
    (getServerSession as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(401);
  });

  it("400 on invalid body", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    const res = await POST(makeReq({}), { params: { id: "L1" } });
    expect(res.status).toBe(400);
  });

  it("404 when lesson missing", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("404 when lesson has no rabbi (organiser-only event)", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ rabbiId: null }));
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("409 when already live", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isLive: true }));
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(409);
  });

  it("403 when user is not a student", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (db.student.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(403);
  });

  it("403 when student is blocked", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: true });
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(403);
  });

  it("403 when not a stream helper", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: false });
    (db.follow.findUnique as any).mockResolvedValueOnce({ isStreamHelper: false });
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(403);
  });

  it("403 when follow record missing", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: false });
    (db.follow.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(403);
  });

  it("403 outside of time window", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(
      lessonRow({ scheduledAt: new Date(Date.now() + 5 * 60 * minute) }),
    );
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: false });
    (db.follow.findUnique as any).mockResolvedValueOnce({ isStreamHelper: true });
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(403);
  });

  it("200 happy path — helper opens live", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: false });
    (db.follow.findUnique as any).mockResolvedValueOnce({ isStreamHelper: true });
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.isLive).toBe(true);
    expect(db.lesson.update).toHaveBeenCalledOnce();
    const args = (db.lesson.update as any).mock.calls[0][0];
    expect(args.data.isLive).toBe(true);
    expect(args.data.liveMethod).toBe("YOUTUBE");
    expect(args.data.liveEmbedUrl).toBe("https://youtube.com/live/x");
  });

  it("200 respects prep window (helper can open 90 min early when prepBeforeMin=120)", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1" } });
    (db.lesson.findUnique as any).mockResolvedValueOnce(
      lessonRow({ scheduledAt: new Date(Date.now() + 90 * minute), prepBeforeMin: 120 }),
    );
    (db.student.findUnique as any).mockResolvedValueOnce({ id: "S1", isBlocked: false });
    (db.follow.findUnique as any).mockResolvedValueOnce({ isStreamHelper: true });
    const res = await POST(makeReq(goodBody), { params: { id: "L1" } });
    expect(res.status).toBe(200);
  });
});
