import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    follow: {
      findUnique: vi.fn(),
      update: vi.fn(async () => ({ ok: true })),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  requireApprovedRabbi: vi.fn(),
}));

import { db } from "@/lib/db";
import { requireApprovedRabbi } from "@/lib/session";
import { PATCH } from "@/app/api/rabbi/helpers/route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/rabbi/helpers", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (requireApprovedRabbi as any).mockResolvedValue({ rabbi: { id: "R1" } });
});

describe("PATCH /api/rabbi/helpers", () => {
  it("400 on invalid body", async () => {
    const res = await PATCH(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("400 when isStreamHelper not boolean", async () => {
    const res = await PATCH(makeReq({ followId: "F1", isStreamHelper: "yes" }));
    expect(res.status).toBe(400);
  });

  it("404 when follow not found", async () => {
    (db.follow.findUnique as any).mockResolvedValueOnce(null);
    const res = await PATCH(makeReq({ followId: "F1", isStreamHelper: true }));
    expect(res.status).toBe(404);
  });

  it("404 when follow belongs to a different rabbi (cannot mark someone else's follower)", async () => {
    (db.follow.findUnique as any).mockResolvedValueOnce({ id: "F1", rabbiId: "R2" });
    const res = await PATCH(makeReq({ followId: "F1", isStreamHelper: true }));
    expect(res.status).toBe(404);
    expect(db.follow.update).not.toHaveBeenCalled();
  });

  it("200 promotes a follower to helper", async () => {
    (db.follow.findUnique as any).mockResolvedValueOnce({ id: "F1", rabbiId: "R1" });
    const res = await PATCH(makeReq({ followId: "F1", isStreamHelper: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.isStreamHelper).toBe(true);
    expect(db.follow.update).toHaveBeenCalledOnce();
  });

  it("200 demotes a helper back to plain follower", async () => {
    (db.follow.findUnique as any).mockResolvedValueOnce({ id: "F1", rabbiId: "R1" });
    const res = await PATCH(makeReq({ followId: "F1", isStreamHelper: false }));
    expect(res.status).toBe(200);
    const args = (db.follow.update as any).mock.calls[0][0];
    expect(args.data.isStreamHelper).toBe(false);
  });
});
