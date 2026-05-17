import { describe, it, expect } from "vitest";
import {
  randomStreamCode,
  normalizeStreamCode,
  streamCodeMatches,
  isWithinStreamWindow,
} from "@/lib/streamCode";

describe("randomStreamCode", () => {
  it("returns format NNNN-WORD (4 digits, hyphen, hebrew word)", () => {
    for (let i = 0; i < 50; i++) {
      const code = randomStreamCode();
      expect(code).toMatch(/^\d{4}-[֐-׿]+$/);
    }
  });

  it("first part is between 1000 and 9999", () => {
    for (let i = 0; i < 100; i++) {
      const [num] = randomStreamCode().split("-");
      const n = parseInt(num, 10);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });

  it("does not always return the same code", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 30; i++) codes.add(randomStreamCode());
    expect(codes.size).toBeGreaterThan(5);
  });
});

describe("normalizeStreamCode", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeStreamCode("  7421-תורה  ")).toBe("7421-תורה");
  });

  it("removes internal whitespace", () => {
    expect(normalizeStreamCode("7421 - תורה")).toBe("7421-תורה");
  });

  it("normalises various hyphens to ASCII hyphen", () => {
    expect(normalizeStreamCode("7421־תורה")).toBe("7421-תורה");
    expect(normalizeStreamCode("7421–תורה")).toBe("7421-תורה");
    expect(normalizeStreamCode("7421—תורה")).toBe("7421-תורה");
  });
});

describe("streamCodeMatches", () => {
  it("matches identical codes", () => {
    expect(streamCodeMatches("7421-תורה", "7421-תורה")).toBe(true);
  });

  it("matches with extra whitespace", () => {
    expect(streamCodeMatches("7421-תורה", "  7421 - תורה ")).toBe(true);
  });

  it("rejects different digits", () => {
    expect(streamCodeMatches("7421-תורה", "7422-תורה")).toBe(false);
  });

  it("rejects different word", () => {
    expect(streamCodeMatches("7421-תורה", "7421-אמונה")).toBe(false);
  });

  it("rejects empty", () => {
    expect(streamCodeMatches("7421-תורה", "")).toBe(false);
  });
});

describe("isWithinStreamWindow", () => {
  const minute = 60_000;

  it("returns true at the scheduled time", () => {
    expect(isWithinStreamWindow(new Date(), 60)).toBe(true);
  });

  it("returns true 30 min before start (within ±60 min)", () => {
    const t = new Date(Date.now() + 30 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(true);
  });

  it("returns true 50 min after start of a 60-min lesson", () => {
    const t = new Date(Date.now() - 50 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(true);
  });

  it("returns false 8 hours before start (outside 6h pre-window)", () => {
    const t = new Date(Date.now() + 8 * 60 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(false);
  });

  it("returns true 2 hours before start (within 6h pre-window)", () => {
    const t = new Date(Date.now() + 120 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(true);
  });

  it("returns false 3 hours after start of a 60-min lesson (past end + grace)", () => {
    const t = new Date(Date.now() - 180 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(false);
  });

  it("uses 60 min default when durationMin is null", () => {
    const t = new Date(Date.now() - 80 * minute);
    // 60 default + 30 grace = 90 → still in
    expect(isWithinStreamWindow(t, null)).toBe(true);
    const t2 = new Date(Date.now() - 100 * minute);
    expect(isWithinStreamWindow(t2, null)).toBe(false);
  });

  it("respects long lessons (3h)", () => {
    const t = new Date(Date.now() - 150 * minute);
    expect(isWithinStreamWindow(t, 180)).toBe(true);
  });

  // === prepBeforeMin extends only the pre-window, never shrinks below 6 hours ===
  it("with prepBeforeMin=480 (8h), allows opening 7h before scheduled (which 6h default rejects)", () => {
    const t = new Date(Date.now() + 7 * 60 * minute);
    expect(isWithinStreamWindow(t, 60)).toBe(false);
    expect(isWithinStreamWindow(t, 60, 480)).toBe(true);
  });

  it("with prepBeforeMin=15, still uses the 6h default (never shrinks below 6h)", () => {
    const t = new Date(Date.now() + 5 * 60 * minute);
    expect(isWithinStreamWindow(t, 60, 15)).toBe(true);
  });

  it("with prepBeforeMin=null behaves like no third arg", () => {
    const t = new Date(Date.now() + 30 * minute);
    expect(isWithinStreamWindow(t, 60, null)).toBe(true);
  });
});
