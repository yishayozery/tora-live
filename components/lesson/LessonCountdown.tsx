"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { computeCountdown } from "@/lib/lesson/hero-state";

/**
 * countdown ויזואלי לזמן ההתחלה של השיעור.
 * SSR-safe: ה-fallback הוא תוצאת חישוב ב-server-time (יציב), ה-client מתחיל לעדכן ב-useEffect.
 */
export function LessonCountdown({
  scheduledAt,
  className = "",
}: {
  scheduledAt: string | Date;
  className?: string;
}) {
  const target = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const targetMs = target.getTime();
  // SSR fallback: ריק כדי למנוע hydration mismatch — נמלא ב-effect.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (nowMs === null) {
    // SSR / hydration — מציגים placeholder שקט (לא יוצר mismatch כי גם ב-client רק אחרי mount נמלא)
    return (
      <span className={`inline-flex items-center gap-2 text-ink-soft text-sm ${className}`}>
        <Clock className="w-4 h-4" aria-hidden />
        <span>מחשב זמן…</span>
      </span>
    );
  }

  const c = computeCountdown(targetMs, nowMs);
  const urgent = !c.expired && c.days === 0 && c.hours === 0;

  return (
    <span
      className={
        `inline-flex items-center gap-2 text-sm font-semibold ` +
        (c.expired
          ? "text-live"
          : urgent
            ? "text-danger"
            : "text-primary") +
        ` ${className}`
      }
      aria-live="polite"
    >
      <Clock className="w-4 h-4" aria-hidden />
      {c.label}
    </span>
  );
}
