"use client";

import { formatHebrewDateFull } from "@/lib/hebrew-dates";

/**
 * מציג את התאריך העברי המלא של ערך datetime-local או date input.
 * שימוש: <HebrewDateHint value={form.scheduledAt} />
 */
export function HebrewDateHint({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const hebrew = formatHebrewDateFull(d);
  if (!hebrew) return null;
  return (
    <p className="text-xs text-primary mt-1 font-medium">📅 {hebrew}</p>
  );
}
