import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHebrewDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * מחזיר טווח שעות כ-"09:00-17:00" (עבור אירועים ארוכים),
 * או שעת התחלה בלבד "09:00" (לשיעורים קצרים, < 90 דק').
 */
export function formatTimeRange(scheduledAt: Date | string, durationMin: number | null | undefined): string {
  const start = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const fmt = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" });
  const startStr = fmt.format(start);
  if (!durationMin || durationMin < 90) return startStr;
  const end = new Date(start.getTime() + durationMin * 60_000);
  return `${startStr}–${fmt.format(end)}`;
}

/**
 * Hebrew pluralization helper.
 * pluralize(1, "שיעור", "שיעורים") → "שיעור אחד"
 * pluralize(2, "שיעור", "שיעורים") → "שני שיעורים"
 * pluralize(5, "שיעור", "שיעורים") → "5 שיעורים"
 * pluralize(0, "שיעור", "שיעורים") → "אין שיעורים"
 */
export function pluralize(
  n: number,
  singular: string,
  plural: string,
  feminine = false,
): string {
  if (n === 0) return `אין ${plural}`;
  if (n === 1) return `${singular} ${feminine ? "אחת" : "אחד"}`;
  if (n === 2) return `שני ${plural}`;
  return `${n.toLocaleString("he-IL")} ${plural}`;
}

export function formatHebrewTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
