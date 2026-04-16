import { describe, it, expect } from "vitest";
import {
  loginSchema,
  studentRegisterSchema,
  rabbiRegisterSchema,
  lessonSchema,
  categorySchema,
} from "@/lib/validators";

describe("loginSchema", () => {
  it("passes valid email + password", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "123456" });
    expect(r.success).toBe(true);
  });
  it("fails on bad email", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "123456" });
    expect(r.success).toBe(false);
  });
  it("fails on short password", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "123" });
    expect(r.success).toBe(false);
  });
});

describe("studentRegisterSchema", () => {
  it("passes valid input", () => {
    const r = studentRegisterSchema.safeParse({
      name: "דוד",
      email: "d@x.co",
      password: "secret1",
    });
    expect(r.success).toBe(true);
  });
  it("fails on short name", () => {
    const r = studentRegisterSchema.safeParse({
      name: "א",
      email: "d@x.co",
      password: "secret1",
    });
    expect(r.success).toBe(false);
  });
});

describe("rabbiRegisterSchema", () => {
  const base = {
    name: "הרב כהן",
    email: "r@x.co",
    password: "secret1",
  };

  it("passes with minimal fields (name/email/password)", () => {
    expect(rabbiRegisterSchema.safeParse(base).success).toBe(true);
  });
  it("allows optional phone", () => {
    const r = rabbiRegisterSchema.safeParse({ ...base, phone: "0501234567" });
    expect(r.success).toBe(true);
  });
  it("allows empty phone", () => {
    const r = rabbiRegisterSchema.safeParse({ ...base, phone: "" });
    expect(r.success).toBe(true);
  });
  it("fails on short password", () => {
    const r = rabbiRegisterSchema.safeParse({ ...base, password: "123" });
    expect(r.success).toBe(false);
  });
  it("fails on bad email", () => {
    const r = rabbiRegisterSchema.safeParse({ ...base, email: "nope" });
    expect(r.success).toBe(false);
  });
});

describe("lessonSchema", () => {
  const base = {
    title: "בבא מציעא דף ל״ב",
    description: "שיעור עומק בסוגיה",
    scheduledAt: new Date().toISOString(),
  };
  it("passes with minimal valid data", () => {
    expect(lessonSchema.safeParse(base).success).toBe(true);
  });
  it("fails on short title", () => {
    const r = lessonSchema.safeParse({ ...base, title: "אב" });
    expect(r.success).toBe(false);
  });
  it("allows empty string for optional urls", () => {
    const r = lessonSchema.safeParse({ ...base, youtubeUrl: "" });
    expect(r.success).toBe(true);
  });
  it("fails on invalid url", () => {
    const r = lessonSchema.safeParse({ ...base, youtubeUrl: "not-a-url" });
    expect(r.success).toBe(false);
  });
  it("accepts existing broadcastType LESSON", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "LESSON" });
    expect(r.success).toBe(true);
  });
  it("accepts new broadcastType HESPED", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "HESPED" });
    expect(r.success).toBe(true);
  });
  it("accepts new broadcastType WEDDING", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "WEDDING" });
    expect(r.success).toBe(true);
  });
  it("accepts new broadcastType NIGGUN", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "NIGGUN" });
    expect(r.success).toBe(true);
  });
  it("accepts new broadcastType SHIUR_KLALI", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "SHIUR_KLALI" });
    expect(r.success).toBe(true);
  });
  it("rejects unknown broadcastType", () => {
    const r = lessonSchema.safeParse({ ...base, broadcastType: "FOO" });
    expect(r.success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("passes valid name", () => {
    expect(categorySchema.safeParse({ name: "הלכה" }).success).toBe(true);
  });
  it("fails on short name", () => {
    expect(categorySchema.safeParse({ name: "א" }).success).toBe(false);
  });
});
