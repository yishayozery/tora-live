// Pure validation for RabbiMessage content.
// Centralized here so API + dashboard + tests share the same rules.

export const RABBI_MESSAGE_MAX = 280;
export const RABBI_MESSAGE_MIN = 2;

export type RabbiMessageValidation =
  | { ok: true; content: string }
  | { ok: false; error: string };

export function validateRabbiMessage(raw: unknown): RabbiMessageValidation {
  if (typeof raw !== "string") {
    return { ok: false, error: "תוכן ההודעה חסר" };
  }
  const trimmed = raw.replace(/\s+$/g, "").replace(/^\s+/g, "");
  if (trimmed.length < RABBI_MESSAGE_MIN) {
    return { ok: false, error: "ההודעה קצרה מדי" };
  }
  if (trimmed.length > RABBI_MESSAGE_MAX) {
    return {
      ok: false,
      error: `ההודעה ארוכה מדי (מקסימום ${RABBI_MESSAGE_MAX} תווים)`,
    };
  }
  return { ok: true, content: trimmed };
}

// Picks the next index for a slideshow rotation given current index + total count.
// Returns 0 when total is 0 (no items) so callers can branch on empty list.
export function nextSlideIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  if (current < 0) return 0;
  return (current + 1) % total;
}

export function prevSlideIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  if (current <= 0) return total - 1;
  return current - 1;
}
