import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      findMany: vi.fn(),
      update: vi.fn(async ({ data }: any) => ({ id: "L1", ...data })),
    },
  },
}));

vi.mock("@/lib/stream", () => ({
  deleteLiveInput: vi.fn(async () => {}),
}));

import { db } from "@/lib/db";
import { deleteLiveInput } from "@/lib/stream";
import { GET } from "@/app/api/cron/cleanup-expired-recordings/route";

function makeReq(auth?: string): Request {
  return new Request("http://localhost/api/cron/cleanup-expired-recordings", {
    method: "GET",
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "secret";
});

describe("GET /api/cron/cleanup-expired-recordings", () => {
  it("401 without auth", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("401 with wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("200 with empty list", async () => {
    (db.lesson.findMany as any).mockResolvedValueOnce([]);
    const res = await GET(makeReq("Bearer secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cleaned).toBe(0);
    expect(data.errors).toEqual([]);
  });

  it("deletes each expired live input and clears DB", async () => {
    (db.lesson.findMany as any).mockResolvedValueOnce([
      { id: "L1", streamId: "s1" },
      { id: "L2", streamId: "s2" },
    ]);
    const res = await GET(makeReq("Bearer secret"));
    expect(res.status).toBe(200);
    expect(deleteLiveInput).toHaveBeenCalledTimes(2);
    expect(deleteLiveInput).toHaveBeenCalledWith("s1");
    expect(deleteLiveInput).toHaveBeenCalledWith("s2");
    expect(db.lesson.update).toHaveBeenCalledTimes(2);
    const args = (db.lesson.update as any).mock.calls[0][0];
    expect(args.data).toMatchObject({
      streamId: null,
      playbackUrl: null,
      recordingUrl: null,
      recordingExpiry: null,
    });
    const data = await res.json();
    expect(data.cleaned).toBe(2);
  });

  it("continues on per-row errors", async () => {
    (db.lesson.findMany as any).mockResolvedValueOnce([
      { id: "L1", streamId: "s1" },
      { id: "L2", streamId: "s2" },
    ]);
    (deleteLiveInput as any).mockImplementationOnce(async () => {
      throw new Error("CF down");
    });
    const res = await GET(makeReq("Bearer secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cleaned).toBe(1);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0]).toMatchObject({ id: "L1" });
  });

  it("uses lt filter on recordingExpiry", async () => {
    (db.lesson.findMany as any).mockResolvedValueOnce([]);
    await GET(makeReq("Bearer secret"));
    const args = (db.lesson.findMany as any).mock.calls[0][0];
    expect(args.where.recordingExpiry).toHaveProperty("lt");
    expect(args.where.streamId).toEqual({ not: null });
  });
});
