"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  expiresAt: string | Date; // ISO או Date
  /** סגנון: chip קומפקטי או טקסט בלבד. ברירת מחדל: chip */
  variant?: "chip" | "text";
  /** הסתר את האייקון. ברירת מחדל: false */
  noIcon?: boolean;
  className?: string;
};

/**
 * תצוגת countdown ויזואלית לפג תוקף הקלטה.
 * - > 24 שעות: מציג ימים + שעות (לדוגמה "4 ימים 12 שעות")
 * - 1-24 שעות: מציג שעות + דקות (לדוגמה "5 שע׳ 20 דק׳")
 * - < שעה: מציג דקות (לדוגמה "45 דק׳") + צבע אזהרה אדום
 * - פג: "פג תוקף" בצבע אדום מעומעם
 *
 * מתעדכן כל דקה. SSR-safe (מתחיל מ-fallback ואז מתעדכן בצד-לקוח).
 */
export function ExpirationCountdown({
  expiresAt,
  variant = "chip",
  noIcon = false,
  className = "",
}: Props) {
  const target = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const [now, setNow] = useState<number>(() => target.getTime() - 1); // fallback ל-SSR

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const diff = target.getTime() - now;
  const expired = diff <= 0;

  let label: string;
  let urgent = false;
  if (expired) {
    label = "פג תוקף";
  } else {
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    if (days >= 1) {
      label = `${days} ${days === 1 ? "יום" : "ימים"}${hours ? ` ${hours} שע׳` : ""}`;
    } else if (hours >= 1) {
      label = `${hours} שע׳${minutes ? ` ${minutes} דק׳` : ""}`;
    } else {
      label = `${Math.max(1, minutes)} דק׳`;
      urgent = true;
    }
  }

  if (variant === "text") {
    return (
      <span
        className={
          "inline-flex items-center gap-1 text-xs " +
          (expired ? "text-ink-muted line-through" : urgent ? "text-danger font-semibold" : "text-ink-muted") +
          " " + className
        }
      >
        {!noIcon && <Clock className="w-3 h-3" aria-hidden />}
        {expired ? label : <>נשארו {label}</>}
      </span>
    );
  }

  // chip
  const baseClasses = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold";
  const colorClasses = expired
    ? "bg-paper-soft text-ink-muted line-through"
    : urgent
      ? "bg-danger/10 text-danger animate-pulse"
      : "bg-gold/10 text-gold";

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${className}`.trim()}
      title={expired ? "פג תוקף — ההקלטה כבר לא זמינה" : `יפוג ב-${target.toLocaleString("he-IL")}`}
      aria-label={expired ? "פג תוקף" : `נשארו ${label} לפג תוקף ההקלטה`}
    >
      {!noIcon && <Clock className="w-3 h-3" aria-hidden />}
      {expired ? label : label}
    </span>
  );
}
