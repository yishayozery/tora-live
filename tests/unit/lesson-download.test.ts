import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/stream", () => ({
  requestMp4Download: vi.fn(),
}));

import { db } from "@/lib/db";
import { requestMp4Download } from "@/lib/stream";
import { GET } from "@/app/api/lessons/[id]/download/route";

function makeReq(): Request {
  return new Request("http://localhost/api/lessons/L1/download", { method: "GET" });
}

function lessonRow(overrides: Partial<any> = {}) {
  return {
    id: "L1",
    isPublic: true,
    isSuspended: false,
    recordingUrl: "https://customer-abc.cloudflarestream.com/abc123def456/manifest/video.m3u8",
    recordingExpiry: new Date(Date.now() + 24 * 3600_000),
    streamId: "abc123def456",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/lessons/[id]/download", () => {
  it("404 when lesson missing", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(null);
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("404 when lesson suspended", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isSuspended: true }));
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("404 when lesson not public", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ isPublic: false }));
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("404 when no recording", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ recordingUrl: null, recordingExpiry: null }));
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("404 when recording expired", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(
      lessonRow({ recordingExpiry: new Date(Date.now() - 1000) }),
    );
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(404);
  });

  it("425 when MP4 still in progress", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (requestMp4Download as any).mockResolvedValueOnce({ url: "", status: "inprogress" });
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(425);
    const data = await res.json();
    expect(typeof data.error).toBe("string");
  });

  it("200 with signed URL when ready", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow());
    (requestMp4Download as any).mockResolvedValueOnce({
      url: "https://videodelivery.net/abc123def456/downloads/default.mp4",
      status: "ready",
    });
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.url).toContain("default.mp4");
  });

  it("500 when CF API throws", async () => {
    (db.lesson.findUnique as any).mockResolvedValueOnce(lessonRow({ recordingUrl: "https://customer-x.cloudflarestream.com/uniqueid999/manifest/video.m3u8", streamId: "uniqueid999" }));
    (requestMp4Download as any).mockRejectedValueOnce(new Error("CF 500"));
    const res = await GET(makeReq(), { params: { id: "L1" } });
    expect(res.status).toBe(500);
  });
});
