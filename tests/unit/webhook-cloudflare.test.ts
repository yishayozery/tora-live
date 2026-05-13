import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      findFirst: vi.fn(),
      update: vi.fn(async ({ data }: any) => ({ id: "L1", ...data })),
    },
  },
}));

vi.mock("@/lib/events", () => ({
  emitShiurCreated: vi.fn(async () => {}),
}));

import { db } from "@/lib/db";
import { emitShiurCreated } from "@/lib/events";
import { POST } from "@/app/api/webhooks/cloudflare/route";

const SECRET = "test-secret";

function sign(body: string, secret: string, time = Math.floor(Date.now() / 1000).toString()) {
  const sig = createHmac("sha256", secret).update(`${time}.${body}`).digest("hex");
  return `time=${time},sig1=${sig}`;
}

function makeReq(payload: unknown, opts: { sign?: boolean; badSig?: boolean } = {}): Request {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.sign) {
    headers["webhook-signature"] = opts.badSig
      ? "time=1,sig1=deadbeef"
      : sign(body, SECRET);
  }
  return new Request("http://localhost/api/webhooks/cloudflare", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  (db.lesson.update as any).mockImplementation(async ({ data }: any) => ({ id: "L1", ...data }));
  process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET = SECRET;
});

describe("POST /api/webhooks/cloudflare — signature verification", () => {
  it("401 when signature missing", async () => {
    const res = await POST(makeReq({ uid: "s1", state: "disconnected" }));
    expect(res.status).toBe(401);
  });

  it("401 when signature bad", async () => {
    const res = await POST(makeReq({ uid: "s1", state: "disconnected" }, { sign: true, badSig: true }));
    expect(res.status).toBe(401);
  });

  it("200 with valid signature", async () => {
    (db.lesson.findFirst as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq({ uid: "s1", state: "connected" }, { sign: true }));
    expect(res.status).toBe(200);
  });

  it("accepts without signature when secret env missing (warn-only mode)", async () => {
    delete process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
    (db.lesson.findFirst as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq({ uid: "s1", state: "idle" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/webhooks/cloudflare — event handling", () => {
  it("ignores unknown event shape gracefully", async () => {
    const res = await POST(makeReq("not an object" as any, { sign: true }));
    expect(res.status).toBe(200);
  });

  it("noop on non-end state", async () => {
    const res = await POST(makeReq({ uid: "s1", state: "connected" }, { sign: true }));
    expect(res.status).toBe(200);
    expect(db.lesson.update).not.toHaveBeenCalled();
  });

  it("ignores when no matching lesson", async () => {
    (db.lesson.findFirst as any).mockResolvedValueOnce(null);
    const res = await POST(makeReq({ uid: "s1", state: "disconnected" }, { sign: true }));
    expect(res.status).toBe(200);
    expect(db.lesson.update).not.toHaveBeenCalled();
  });

  it("does nothing if lesson already closed", async () => {
    (db.lesson.findFirst as any).mockResolvedValueOnce({
      id: "L1",
      isLive: false,
      streamId: "s1",
      rabbiId: "R1",
      title: "שיעור",
      recordingUrl: null,
    });
    const res = await POST(makeReq({ uid: "s1", state: "disconnected" }, { sign: true }));
    expect(res.status).toBe(200);
    expect(db.lesson.update).not.toHaveBeenCalled();
  });

  it("flips isLive and emits on disconnected", async () => {
    (db.lesson.findFirst as any).mockResolvedValueOnce({
      id: "L1",
      isLive: true,
      streamId: "s1",
      rabbiId: "R1",
      title: "שיעור",
      recordingUrl: null,
    });
    const res = await POST(makeReq({ uid: "s1", state: "disconnected" }, { sign: true }));
    expect(res.status).toBe(200);
    expect(db.lesson.update).toHaveBeenCalledOnce();
    const args = (db.lesson.update as any).mock.calls[0][0];
    expect(args.data.isLive).toBe(false);
    expect(args.data.recordingExpiry).toBeInstanceOf(Date);
    expect(emitShiurCreated).toHaveBeenCalledOnce();
  });

  it("handles nested status.current.state shape", async () => {
    (db.lesson.findFirst as any).mockResolvedValueOnce({
      id: "L2",
      isLive: true,
      streamId: "s2",
      rabbiId: null,
      title: "שיעור ב",
      recordingUrl: null,
    });
    const res = await POST(
      makeReq({ uid: "s2", status: { current: { state: "idle" } } }, { sign: true }),
    );
    expect(res.status).toBe(200);
    expect(db.lesson.update).toHaveBeenCalledOnce();
  });
});
