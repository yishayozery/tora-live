"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHebrewHoliday, formatHebrewDayOnly, formatHebrewMonthOnly } from "@/lib/hebrew-dates";
import { formatTimeRange } from "@/lib/utils";

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

/** קובע את ה-variant של שיעור לפי הנתונים שלו (variant מפורש → live → EVENT (>=90min or broadcastType=EVENT) → lesson) */
function resolveVariant(l: CalendarLesson): "lesson" | "live" | "event" | "approvedRequest" | "private" {
  if (l.variant) return l.variant;
  if (l.isLive) return "live";
  // יום עיון / אירוע — לפי broadcastType או משך > 90 דק'
  if (l.broadcastType === "EVENT" || (l.durationMin && l.durationMin >= 90)) return "event";
  return "lesson";
}

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
  const [filter, setFilter] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "2weeks" | "month">("2weeks");

  const rangeLengthDays = viewMode === "day" ? 1 : viewMode === "week" ? 7 : viewMode === "month" ? 30 : 14;
  const rangeStepDays = rangeLengthDays;

  const gridDays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = viewMode === "day"
      ? new Date(today.getTime() + weekOffset * 86400000)
      : (() => {
          const s = getCurrentWeekStart();
          s.setDate(s.getDate() + weekOffset * rangeStepDays);
          return s;
        })();
    return Array.from({ length: rangeLengthDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset, viewMode, rangeStepDays, rangeLengthDays]);

  // טווח התצוגה לכותרת — עברי + לועזי
  const rangeLabel = useMemo(() => {
    if (gridDays.length === 0) return "";
    const first = gridDays[0];
    const last = gridDays[gridDays.length - 1];
    const fmtGreg = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });
    const firstHe = formatHebrewDayOnly(first) + " " + formatHebrewMonthOnly(first);
    const lastHe = formatHebrewDayOnly(last) + " " + formatHebrewMonthOnly(last);
    return `${firstHe} – ${lastHe} · ${fmtGreg.format(first)} – ${fmtGreg.format(last)}`;
  }, [gridDays]);

  // סינון שיעורים לפי חיפוש
  const filteredLessons = useMemo(() => {
    if (!filter.trim()) return lessons;
    const q = filter.toLowerCase();
    return lessons.filter((l) =>
      l.title.toLowerCase().includes(q) ||
      l.rabbiName.toLowerCase().includes(q) ||
      (l.category ?? "").toLowerCase().includes(q)
    );
  }, [lessons, filter]);

  /** מיפוי dateString -> שיעורים */
  const lessonsByDate = useMemo(() => {
    const map = new Map<string, CalendarLesson[]>();
    for (const l of filteredLessons) {
      const key = new Date(l.scheduledAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    // מיון לפי שעה
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [filteredLessons]);

  const todayStr = new Date().toDateString();

  return (
    <section className={cn(
      compact ? "" : "relative overflow-hidden py-14 sm:py-20 scroll-mt-16"
    )}>
      {!compact && (
        <>
          {/* רקע 2: נייר/ספרייה — טון חם */}
          <div className="absolute inset-0 bg-gradient-to-b from-paper-warm via-white to-paper-soft pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: "linear-gradient(45deg, transparent 48%, rgba(184, 134, 47, 0.5) 49%, rgba(184, 134, 47, 0.5) 51%, transparent 52%)",
              backgroundSize: "20px 20px",
            }}
          />
        </>
      )}
      <div className={cn(compact ? "" : "relative max-w-6xl mx-auto px-4")}>
      {!compact && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="w-8 h-0.5 bg-gold/40" />
            <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink">{title}</h2>
            <span className="w-8 h-0.5 bg-gold/40" />
          </div>
          <p className="text-sm text-ink-muted">שיעורים, תפילות ואירועים קרובים</p>
        </div>
      )}

      {/* חיפוש + toggle תצוגה (לא compact) */}
      {!compact && (
        <div className="max-w-2xl mx-auto mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="חפש בלוח לפי רב, נושא או כותרת..."
              className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none shadow-soft"
            />
          </div>
          <div className="flex gap-1 p-1 bg-paper-soft rounded-btn border border-border" role="group" aria-label="תצוגה">
            {[
              { v: "day" as const, label: "יום" },
              { v: "week" as const, label: "שבוע" },
              { v: "2weeks" as const, label: "שבועיים" },
              { v: "month" as const, label: "חודש" },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => { setViewMode(opt.v); setWeekOffset(0); }}
                className={`h-9 px-3 text-sm font-medium rounded-btn transition ${
                  viewMode === opt.v ? "bg-primary text-white" : "text-ink-soft hover:text-ink hover:bg-white"
                }`}
                aria-pressed={viewMode === opt.v}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ניווט בין תקופות */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {compact && <h2 className="hebrew-serif text-2xl font-bold text-ink">{title}</h2>}
        <div className="flex items-center gap-2 mx-auto">
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
            עכשיו
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
                  <div className="flex items-center gap-2 text-sm font-bold flex-wrap">
                    <span>{DAY_NAMES[day.getDay()]}</span>
                    <span className="opacity-75">·</span>
                    <span className="hebrew-serif">{formatHebrewDayOnly(day)} {formatHebrewMonthOnly(day)}</span>
                    <span className="text-xs font-normal opacity-60">({day.getDate()}/{day.getMonth() + 1})</span>
                    {holiday && <span className="text-xs font-medium opacity-90">· {holiday}</span>}
                  </div>
                  <span className={cn("text-xs shrink-0", isToday ? "text-white/80" : "text-ink-muted")}>
                    {dayLessons.length}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 bg-white">
                  {dayLessons.map((l) => {
                    const variant = resolveVariant(l);
                    const cls = variant === "live"
                      ? "bg-live/10 text-live border-live/20"
                      : variant === "event"
                        ? "bg-gold-soft text-gold border-gold/40 font-semibold"
                        : "bg-primary-soft text-primary border-primary/20";
                    return (
                      <Link key={l.id} href={l.href ?? `/lesson/${l.id}`} className={cn(
                        "block rounded-btn border p-2 text-sm leading-tight transition active:scale-[0.98]",
                        cls
                      )}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold flex items-center gap-1">
                            {variant === "event" && <span>🎪</span>}
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatTimeRange(l.scheduledAt, l.durationMin ?? null)}
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
          const hebrewDay = formatHebrewDayOnly(day);
          const hebrewMonth = formatHebrewMonthOnly(day);
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
              {/* כותרת יום — תאריך עברי באותיות + יום בשבוע במובייל */}
              <div className={cn("mb-1", isToday ? "text-primary" : "text-ink-muted")}>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="sm:hidden text-xs font-semibold">{DAY_NAMES[day.getDay()]}</span>
                  <span className="hebrew-serif font-bold text-base leading-none">{hebrewDay}</span>
                  <span className="text-[10px] text-ink-muted">{hebrewMonth}</span>
                </div>
                <div className="text-[10px] text-ink-subtle mt-0.5">{day.getDate()}/{day.getMonth() + 1}</div>
              </div>

              {/* שם חג */}
              {holiday && (
                <div className="text-[10px] font-medium text-gold mb-1 truncate" title={holiday}>
                  {holiday}
                </div>
              )}

              {/* שיעורים — מיון: אירועים ארוכים למעלה, שידורים חיים אחריהם, שיעורים רגילים */}
              <div className="space-y-1">
                {(() => {
                  // מיון: events קודם (ארוך יותר), אז live, אז lessons
                  const sorted = [...dayLessons].sort((a, b) => {
                    const priority = (l: CalendarLesson) => {
                      const v = resolveVariant(l);
                      return v === "event" ? 0 : l.isLive ? 1 : 2;
                    };
                    return priority(a) - priority(b) || new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
                  });
                  const MAX_VISIBLE = 3;
                  const visible = sorted.slice(0, MAX_VISIBLE);
                  const hidden = sorted.slice(MAX_VISIBLE);

                  return (
                    <>
                      {visible.map((l) => {
                        const variant = resolveVariant(l);
                        const cls =
                          variant === "live"
                            ? "bg-live/10 text-live border border-live/20"
                            : variant === "event"
                              ? "bg-gold-soft text-gold border border-gold/40 font-semibold"
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
                            <div className="flex items-center gap-1 mb-0.5">
                              {variant === "event" && <span className="text-[10px]">🎪</span>}
                              <span className="font-semibold truncate">{l.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-75 mt-0.5">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              {formatTimeRange(l.scheduledAt, l.durationMin ?? null)}
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
                      {hidden.length > 0 && (
                        <details className="group">
                          <summary className="cursor-pointer text-[11px] text-ink-muted hover:text-primary text-center py-1 border border-dashed border-border rounded-btn hover:border-primary list-none">
                            + עוד {hidden.length} {hidden.length === 1 ? "פריט" : "פריטים"}
                          </summary>
                          <div className="mt-1 space-y-1">
                            {hidden.map((l) => {
                              const variant = resolveVariant(l);
                              const cls =
                                variant === "live" ? "bg-live/10 text-live border border-live/20"
                                : variant === "event" ? "bg-gold-soft text-gold border border-gold/40"
                                : "bg-primary-soft text-primary border border-primary/20";
                              return (
                                <Link key={l.id} href={l.href ?? `/lesson/${l.id}`} className={cn("block rounded-btn p-1.5 text-[11px]", cls)}>
                                  <div className="font-semibold truncate">{l.title}</div>
                                  <div className="opacity-75">{formatTimeRange(l.scheduledAt, l.durationMin ?? null)}</div>
                                </Link>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </>
                  );
                })()}
                {dayLessons.length === 0 && (
                  <div className="text-[10px] text-ink-muted text-center py-2 hidden sm:block">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
