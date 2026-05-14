import { describe, it, expect } from "vitest";
import {
  validateRabbiMessage,
  nextSlideIndex,
  prevSlideIndex,
  RABBI_MESSAGE_MAX,
} from "@/lib/rabbi-message";

describe("validateRabbiMessage", () => {
  it("rejects non-strings", () => {
    expect(validateRabbiMessage(undefined).ok).toBe(false);
    expect(validateRabbiMessage(null).ok).toBe(false);
    expect(validateRabbiMessage(42).ok).toBe(false);
  });

  it("rejects empty / too short", () => {
    expect(validateRabbiMessage("").ok).toBe(false);
    expect(validateRabbiMessage("   ").ok).toBe(false);
    expect(validateRabbiMessage("a").ok).toBe(false);
  });

  it("rejects too long", () => {
    const big = "א".repeat(RABBI_MESSAGE_MAX + 1);
    const r = validateRabbiMessage(big);
    expect(r.ok).toBe(false);
  });

  it("accepts and trims valid content", () => {
    const r = validateRabbiMessage("  שלום לכולם  ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content).toBe("שלום לכולם");
  });

  it("accepts exactly RABBI_MESSAGE_MAX", () => {
    const exact = "א".repeat(RABBI_MESSAGE_MAX);
    expect(validateRabbiMessage(exact).ok).toBe(true);
  });
});

describe("nextSlideIndex", () => {
  it("rotates forward", () => {
    expect(nextSlideIndex(0, 3)).toBe(1);
    expect(nextSlideIndex(1, 3)).toBe(2);
    expect(nextSlideIndex(2, 3)).toBe(0);
  });
  it("returns 0 when empty", () => {
    expect(nextSlideIndex(0, 0)).toBe(0);
    expect(nextSlideIndex(5, 0)).toBe(0);
  });
  it("treats negative current as 0", () => {
    expect(nextSlideIndex(-1, 3)).toBe(0);
  });
  it("handles single item", () => {
    expect(nextSlideIndex(0, 1)).toBe(0);
  });
});

describe("prevSlideIndex", () => {
  it("rotates backward", () => {
    expect(prevSlideIndex(2, 3)).toBe(1);
    expect(prevSlideIndex(1, 3)).toBe(0);
    expect(prevSlideIndex(0, 3)).toBe(2);
  });
  it("returns 0 when empty", () => {
    expect(prevSlideIndex(0, 0)).toBe(0);
  });
  it("handles single item", () => {
    expect(prevSlideIndex(0, 1)).toBe(0);
  });
});
