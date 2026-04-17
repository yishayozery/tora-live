"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHebrewHoliday, formatHebrewCalendarDate } from "@/lib/hebrew-dates";

type CalendarLesson = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  scheduledAt: string;
  durationMin?: number;
  category?: string;
  isLive?: boolean;
  broadcastType?: string;
  /** סוג ויזואלי: lesson (כחול), live (ירוק), event (זהב), approvedRequest (סגול) */
  variant?: "lesson" | "live" | "event" | "approvedRequest";
  /** קישור יעד. אם חסר — /lesson/{id} */
  href?: string;
  /** האם להראות כפתור "התחל שידור" (חלון של ±30 דק' מ-now). רלוונטי לדשבורד רב בלבד */
  canStartBroadcast?: boolean;
};

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const timeFmt = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" });

/** ראשון של השבוע הנוכחי */
function getCurrentWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const start = new Date(now);
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function WeeklyCalendar({
  lessons,
  title = "לוח שיעורים",
  compact = false,
}: {
  lessons: CalendarLesson[];
  title?: string;
  compact?: boolean;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  /** 4 שבועות מתחילת השבוע הנוכחי + offset */
  const gridDays = useMemo(() => {
    const start = getCurrentWeekStart();
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // טווח התצוגה לכותרת
  const rangeLabel = useMemo(() => {
    if (gridDays.length === 0) return "";
    const first = gridDays[0];
    const last = gridDays[gridDays.length - 1];
    const fmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });
    return `${fmt.format(first)} – ${fmt.format(last)}`;
  }, [gridDays]);

  /** מיפוי dateString -> שיעורים */
  const lessonsByDate = useMemo(() => {
    const map = new Map<string, CalendarLesson[]>();
    for (const l of lessons) {
      const key = new Date(l.scheduledAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    // מיון לפי שעה
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [lessons]);

  const todayStr = new Date().toDateString();

  return (
    <section className={cn(compact ? "" : "max-w-6xl mx-auto px-4 mt-12")}>
      {/* כותרת + ניווט שבועי (4 שבועות קדימה מהיום) */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="hebrew-serif text-2xl font-bold text-ink">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="w-9 h-9 flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={cn(
              "h-9 px-3 text-sm rounded-btn border transition",
              weekOffset === 0
                ? "bg-primary text-white border-primary"
                : "border-border bg-white hover:bg-paper-soft"
            )}
          >
            השבוע
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft"
            aria-label="קדימה"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-ink mr-2">{rangeLabel}</span>
        </div>
      </div>

      {/* כותרות ימים — desktop */}
      <div className="hidden sm:grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-semibold text-ink-muted py-1">
            {name}
          </div>
        ))}
      </div>

      {/* גריד 4 שבועות */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-1 sm:gap-2">
        {gridDays.map((day, i) => {
          const isToday = day.toDateString() === todayStr;
          const isSabbath = day.getDay() === 6;
          const holiday = getHebrewHoliday(day);
          const hebrewDate = formatHebrewCalendarDate(day);
          const dayLessons = lessonsByDate.get(day.toDateString()) ?? [];

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] sm:min-h-[120px] rounded-card border p-2 transition",
                // רקע
                holiday
                  ? "bg-gold/5 border-gold/30"
                  : isSabbath
                    ? "bg-paper-warm/40 border-border"
                    : isToday
                      ? "border-primary bg-primary-soft/20"
                      : "border-border bg-white"
              )}
            >
              {/* כותרת יום — מובייל מציג שם יום, דסקטופ לא (כבר בכותרת) */}
              <div className={cn("text-xs font-semibold mb-1", isToday ? "text-primary" : "text-ink-muted")}>
                <span className="sm:hidden ml-1">{DAY_NAMES[day.getDay()]}</span>
                <span>{day.getDate()}</span>
                <span className="mr-1 text-[10px] text-ink-muted">{hebrewDate}</span>
              </div>

              {/* שם חג */}
              {holiday && (
                <div className="text-[10px] font-medium text-gold mb-1 truncate" title={holiday}>
                  {holiday}
                </div>
              )}

              {/* שיעורים */}
              <div className="space-y-1">
                {dayLessons.map((l) => {
                  const variant = l.variant ?? (l.isLive ? "live" : "lesson");
                  const cls =
                    variant === "live"
                      ? "bg-live/10 text-live border border-live/20"
                      : variant === "event"
                        ? "bg-gold-soft text-gold border border-gold/30"
                        : variant === "approvedRequest"
                          ? "bg-purple-100 text-purple-700 border border-purple-300"
                          : "bg-primary-soft text-primary border border-primary/20 hover:bg-primary-soft/70";
                  return (
                    <Link
                      key={l.id}
                      href={l.href ?? `/lesson/${l.id}`}
                      className={cn(
                        "block rounded-btn p-1.5 text-[11px] leading-tight transition hover:shadow-soft",
                        cls
                      )}
                    >
                      <div className="font-semibold truncate">{l.title}</div>
                      <div className="flex items-center gap-1 opacity-75 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {timeFmt.format(new Date(l.scheduledAt))}
                      </div>
                      <div className="opacity-75 truncate">{l.rabbiName}</div>
                      {l.canStartBroadcast && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-live px-1.5 py-0.5 text-[9px] font-bold text-white">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          התחל שידור
                        </div>
                      )}
                    </Link>
                  );
                })}
                {dayLessons.length === 0 && (
                  <div className="text-[10px] text-ink-muted text-center py-2 hidden sm:block">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
