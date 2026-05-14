import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client BEFORE importing the route
vi.mock("@/lib/db", () => {
  const lesson = {
    findUnique: vi.fn(),
    update: vi.fn(async ({ data }) => ({ id: "L1", ...data })),
  };
  return { db: { lesson } };
});

import { db } from "@/lib/db";
import { POST } from "@/app/api/lessons/[id]/live-by-code/route";

const minute = 60_000;

function makeReq(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/lessons/L1/live-by-code", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function lessonRow(overrides: Partial<any> = {}) {
  return {
    id: "L1",
    scheduledAt: new Date(),
    durationMin: 60,
    streamCode: "7421-תורה",
    isLive: false,
    isSuspended: false,
    isPublic: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/lessons/[id]/live-by-code", () => {
  it("400 on invalid body", async () => {
    const res = await POST(makeReq({}), { params: { id: "L1" } });
    expect(res.status).toBe(400);
  });

  it("404 when lesson missing", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(404);
  });

  it("404 when lesson suspended", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isSuspended: true }));
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.1"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(404);
  });

  it("404 when lesson not public", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isPublic: false }));
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.2"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(404);
  });

  it("409 when already live", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isLive: true }));
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.3"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(409);
  });

  it("400 when no streamCode set on lesson", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ streamCode: null }));
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.4"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(400);
  });

  it("403 outside of stream window (lesson 5 hours away)", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(
      lessonRow({ scheduledAt: new Date(Date.now() + 5 * 60 * minute) }),
    );
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.5"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(403);
  });

  it("401 on wrong code", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    const res = await POST(
      makeReq({ code: "9999-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, "2.0.0.6"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(401);
    expect(db.lesson.update).not.toHaveBeenCalled();
  });

  it("200 + sets isLive on correct code (YouTube)", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/abc" }, "2.0.0.7"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.isLive).toBe(true);
    expect(db.lesson.update).toHaveBeenCalledOnce();
    const args = (db.lesson.update as any).mock.calls[0][0];
    expect(args.data.isLive).toBe(true);
    expect(args.data.liveMethod).toBe("YOUTUBE");
    expect(args.data.liveEmbedUrl).toBe("https://youtube.com/live/abc");
  });

  it("200 with normalised whitespace in code", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    const res = await POST(
      makeReq({ code: "  7421 - תורה  ", liveMethod: "EXTERNAL", liveEmbedUrl: "https://zoom.us/j/123" }, "2.0.0.8"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(200);
  });

  it("400 on non-URL liveEmbedUrl", async () => {
    const res = await POST(
      makeReq({ code: "7421-תורה", liveMethod: "YOUTUBE", liveEmbedUrl: "not a url" }, "2.0.0.9"),
      { params: { id: "L1" } },
    );
    expect(res.status).toBe(400);
  });

  it("429 after too many attempts from same IP", async () => {
    (db.lesson.findUnique as any).mockResolvedValue(lessonRow());
    const ip = "9.9.9.9";
    let last = 200;
    for (let i = 0; i < 12; i++) {
      const res = await POST(
        makeReq({ code: "0000-לאנכון", liveMethod: "YOUTUBE", liveEmbedUrl: "https://youtube.com/live/x" }, ip),
        { params: { id: "L1" } },
      );
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
