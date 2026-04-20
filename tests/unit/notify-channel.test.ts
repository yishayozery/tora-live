import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing notify.
const mockNotification = { id: "n1" };
const studentStore: Record<string, any> = {};

// Force notify.ts to use console.log fallback (no resend)
process.env.RESEND_API_KEY = "";

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findUnique: vi.fn(async ({ where }: any) => studentStore[where.id] ?? null),
    },
    user: {
      findUnique: vi.fn(async () => ({ email: "stub@example.com" })),
    },
    notification: {
      create: vi.fn(async () => mockNotification),
      update: vi.fn(async () => mockNotification),
    },
  },
}));

import { notifyStudent } from "@/lib/notify";
import { db } from "@/lib/db";

function setStudent(partial: any) {
  studentStore["s1"] = {
    id: "s1",
    userId: "u1",
    isBlocked: false,
    notifyChannel: "NONE",
    phoneE164: null,
    ...partial,
  };
}

const baseInput = {
  studentId: "s1",
  kind: "LESSON_STARTING" as any,
  title: "שיעור מתחיל",
  body: "עוד 10 דקות",
  link: "/lesson/1",
};

describe("notifyStudent channel selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocked student receives nothing", async () => {
    setStudent({ isBlocked: true });
    const r = await notifyStudent(baseInput);
    expect(r).toBeUndefined();
    expect((db as any).notification.create).not.toHaveBeenCalled();
  });

  it("NONE creates in-app notification but does not send email/wa", async () => {
    setStudent({ notifyChannel: "NONE" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyStudent(baseInput);
    expect((db as any).notification.create).toHaveBeenCalledOnce();
    expect((db as any).notification.update).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("EMAIL triggers email stub and marks sentEmail", async () => {
    setStudent({ notifyChannel: "EMAIL" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyStudent(baseInput);
    expect(logSpy).toHaveBeenCalled();
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toMatch(/\[email/);
    expect(logged).not.toMatch(/\[wa/);
    expect((db as any).notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sentEmail: true } })
    );
    logSpy.mockRestore();
  });

  it("WHATSAPP without phone does not call wa stub", async () => {
    setStudent({ notifyChannel: "WHATSAPP", phoneE164: null });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyStudent(baseInput);
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).not.toMatch(/\[wa/);
    logSpy.mockRestore();
  });

  it("BOTH with phone calls both stubs", async () => {
    setStudent({ notifyChannel: "BOTH", phoneE164: "+972501234567" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyStudent(baseInput);
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toMatch(/\[email/);
    expect(logged).toMatch(/\[wa/);
    logSpy.mockRestore();
  });
});
