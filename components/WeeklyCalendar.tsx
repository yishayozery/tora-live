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
  /** סוג ויזואלי: lesson (כחול), live (ירוק), event (זהב), approvedRequest (סגול), private (מקווקו) */
  variant?: "lesson" | "live" | "event" | "approvedRequest" | "private";
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

  /** שבוע אחד מתחילת השבוע הנוכחי + offset */
  const gridDays = useMemo(() => {
    const start = getCurrentWeekStart();
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
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

      {/* === MOBILE: Agenda mode === מציג רק ימים שיש בהם שיעורים */}
      <div className="sm:hidden space-y-3">
        {(() => {
          const daysWithLessons = gridDays.filter((day) => (lessonsByDate.get(day.toDateString()) ?? []).length > 0);
          if (daysWithLessons.length === 0) {
            return (
              <div className="rounded-card border border-border bg-paper-soft p-6 text-center text-sm text-ink-muted">
                אין שיעורים מתוזמנים בשבוע הזה
              </div>
            );
          }
          return daysWithLessons.map((day, i) => {
            const isToday = day.toDateString() === todayStr;
            const isSabbath = day.getDay() === 6;
            const holiday = getHebrewHoliday(day);
            const dayLessons = lessonsByDate.get(day.toDateString()) ?? [];
            return (
              <div key={i} className={cn(
                "rounded-card border overflow-hidden",
                holiday ? "border-gold/30" : isSabbath ? "border-border" : isToday ? "border-primary" : "border-border"
              )}>
                <div className={cn(
                  "px-3 py-2 flex items-center justify-between gap-2",
                  holiday ? "bg-gold/10" : isSabbath ? "bg-paper-warm/50" : isToday ? "bg-primary text-white" : "bg-paper-soft"
                )}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>{DAY_NAMES[day.getDay()]}</span>
                    <span className="opacity-75">·</span>
                    <span>{day.getDate()}/{day.getMonth() + 1}</span>
                    {holiday && <span className="text-xs font-medium opacity-90">· {holiday}</span>}
                  </div>
                  <span className={cn("text-xs", isToday ? "text-white/80" : "text-ink-muted")}>
                    {dayLessons.length} שיעורים
                  </span>
                </div>
                <div className="p-2 space-y-1.5 bg-white">
                  {dayLessons.map((l) => {
                    const variant = l.variant ?? (l.isLive ? "live" : "lesson");
                    const cls = variant === "live"
                      ? "bg-live/10 text-live border-live/20"
                      : variant === "event"
                        ? "bg-gold-soft text-gold border-gold/30"
                        : "bg-primary-soft text-primary border-primary/20";
                    return (
                      <Link key={l.id} href={l.href ?? `/lesson/${l.id}`} className={cn(
                        "block rounded-btn border p-2 text-sm leading-tight transition active:scale-[0.98]",
                        cls
                      )}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {timeFmt.format(new Date(l.scheduledAt))}
                          </span>
                          {l.isLive && <span className="text-[10px] font-bold inline-flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />LIVE</span>}
                        </div>
                        <div className="font-medium line-clamp-2 mb-0.5">{l.title}</div>
                        <div className="text-xs opacity-75 truncate">{l.rabbiName}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* === DESKTOP: Grid mode === */}
      {/* כותרות ימים */}
      <div className="hidden sm:grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-semibold text-ink-muted py-1">
            {name}
          </div>
        ))}
      </div>

      {/* גריד שבוע — desktop only */}
      <div className="hidden sm:grid grid-cols-7 gap-1 sm:gap-2">
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
                          : variant === "private"
                            ? "bg-paper-soft text-ink-muted border border-border border-dashed"
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
