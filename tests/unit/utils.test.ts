import { describe, it, expect } from "vitest";
import { cn, formatHebrewDate, formatHebrewTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("tailwind-merge resolves conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatHebrewDate", () => {
  it("returns a non-empty string for a Date", () => {
    const out = formatHebrewDate(new Date("2026-04-09T10:00:00Z"));
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
  it("accepts an ISO string", () => {
    const out = formatHebrewDate("2026-04-09T10:00:00Z");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("formatHebrewTime", () => {
  it("returns HH:MM-like format", () => {
    const out = formatHebrewTime(new Date("2026-04-09T10:30:00Z"));
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});
