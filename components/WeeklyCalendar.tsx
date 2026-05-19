"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Search, Filter, Printer, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHebrewHoliday, formatHebrewDayOnly, formatHebrewMonthOnly } from "@/lib/hebrew-dates";
import { formatTimeRange } from "@/lib/utils";
import { BROADCAST_TYPES, languageLabel } from "@/lib/enums";
import { CalendarBookmarkIcon } from "@/components/CalendarBookmarkIcon";

type CalendarLesson = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  scheduledAt: string;
  durationMin?: number;
  category?: string;
  language?: string;
  isLive?: boolean;
  broadcastType?: string;
  /** קוד פתיחת שידור — מופיע ב-WhatsApp share. רלוונטי רק לרב/אדמין */
  streamCode?: string | null;
  /** סוג ויזואלי: lesson (כחול), live (ירוק), event (זהב), approvedRequest (סגול), private (מקווקו) */
  variant?: "lesson" | "live" | "event" | "approvedRequest" | "private";
  /** קישור יעד. אם חסר — /lesson/{id} */
  href?: string;
  /** האם להראות כפתור "התחל שידור" (חלון של ±30 דק' מ-now). רלוונטי לדשבורד רב בלבד */
  canStartBroadcast?: boolean;
  /** האם המשתמש הנוכחי כבר סימן את השיעור ללוח האישי שלו */
  bookmarked?: boolean;
  /** פוסטר של יום עיון — אם קיים, מוצג בכותרת היום */
  posterUrl?: string | null;
};

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const timeFmt = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" });

/** קובע את ה-variant של שיעור לפי הנתונים שלו (variant מפורש → live → EVENT (>=90min or broadcastType=EVENT) → lesson) */
function resolveVariant(l: CalendarLesson): "lesson" | "live" | "event" | "approvedRequest" | "private" {
  if (l.variant) return l.variant;
  if (l.isLive) return "live";
  // יום עיון / אירוע — לפי broadcastType או משך > 90 דק'
  if (l.broadcastType === "SEMINAR" || l.broadcastType === "EVENT" || (l.durationMin && l.durationMin >= 90)) return "event";
  return "lesson";
}

/** בונה לינק WhatsApp עם רשימת שיעורים מסודרת לפי תאריך/שעה + קישורים + קודי שידור (אם קיימים) */
function buildWhatsappShareUrl(
  lessons: CalendarLesson[],
  gridDays: Date[],
  rangeLabel: string,
  title: string,
): string {
  // מסנן לטווח הימים המוצג בלבד
  const inRange = lessons.filter((l) => {
    const d = new Date(l.scheduledAt).toDateString();
    return gridDays.some((g) => g.toDateString() === d);
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  let msg = `📋 ${title} — ${rangeLabel}\n\n`;

  if (inRange.length === 0) {
    msg += "אין שיעורים מתוזמנים בתקופה זו.\n";
  } else {
    // קבץ לפי יום
    const byDay = new Map<string, CalendarLesson[]>();
    for (const l of inRange) {
      const key = new Date(l.scheduledAt).toDateString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(l);
    }
    const sortedKeys = Array.from(byDay.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    for (const key of sortedKeys) {
      const dayDate = new Date(key);
      msg += `📅 יום ${dayNames[dayDate.getDay()]} ${dayDate.toLocaleDateString("he-IL")}\n`;
      const dayLessons = (byDay.get(key) ?? []).sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      for (const l of dayLessons) {
        const t = new Date(l.scheduledAt);
        const time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
        msg += `  • ${time} — ${l.title}`;
        if (l.rabbiName) msg += ` (${l.rabbiName})`;
        msg += `\n    ${origin}/lesson/${l.id}\n`;
        if (l.streamCode) msg += `    🔑 קוד שידור: ${l.streamCode}\n`;
      }
      msg += "\n";
    }
  }

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
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
  canBookmark: canBookmarkProp,
}: {
  lessons: CalendarLesson[];
  title?: string;
  compact?: boolean;
  /**
   * אם המשתמש יכול לסמן ללוח (תלמיד מחובר ולא חסום).
   * undefined → נקבע בצד הלקוח דרך /api/bookmarks/me (תומך ב-ISR בדף האב).
   */
  canBookmark?: boolean;
}) {
  // מצב לקוחי של bookmarks — נטען אחרי mount כדי לא לכפות דינמיות על דף הבית ISR.
  // אם הפרופ הועבר (true/false) — מנצחים אותו (תאימות אחורה).
  const [clientBookmarks, setClientBookmarks] = useState<{ ids: Set<string>; canBookmark: boolean } | null>(null);
  useEffect(() => {
    if (typeof canBookmarkProp === "boolean") return; // הוזרק מהשרת, אין צורך לטעון
    let cancelled = false;
    fetch("/api/bookmarks/me", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { ids: [], canBookmark: false })
      .then((data: { ids: string[]; canBookmark: boolean }) => {
        if (cancelled) return;
        setClientBookmarks({ ids: new Set(data.ids), canBookmark: !!data.canBookmark });
      })
      .catch(() => {
        if (!cancelled) setClientBookmarks({ ids: new Set(), canBookmark: false });
      });
    return () => { cancelled = true; };
  }, [canBookmarkProp]);

  const canBookmark = typeof canBookmarkProp === "boolean" ? canBookmarkProp : (clientBookmarks?.canBookmark ?? false);

  // ממזגים את ה-bookmarks הלקוחיים לתוך השיעורים
  const enrichedLessons = useMemo(() => {
    if (!clientBookmarks) return lessons;
    return lessons.map((l) => ({ ...l, bookmarked: l.bookmarked ?? clientBookmarks.ids.has(l.id) }));
  }, [lessons, clientBookmarks]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "2weeks" | "month">("2weeks");
  const [rabbiFilter, setRabbiFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");

  // אפשרויות פילטר מתוך הלוח
  const rabbiOptions = useMemo(() => {
    const map = new Map<string, number>();
    enrichedLessons.forEach((l) => map.set(l.rabbiName, (map.get(l.rabbiName) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedLessons]);
  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    enrichedLessons.forEach((l) => { if (l.category) map.set(l.category, (map.get(l.category) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedLessons]);
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    enrichedLessons.forEach((l) => { if (l.language) set.add(l.language); });
    return Array.from(set);
  }, [enrichedLessons]);

  const hasActiveFilter = !!(filter || rabbiFilter || categoryFilter || typeFilter || languageFilter);
  const clearAll = () => { setFilter(""); setRabbiFilter(""); setCategoryFilter(""); setTypeFilter(""); setLanguageFilter(""); };

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

  // סינון שיעורים — חיפוש + פילטרים
  const filteredLessons = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return enrichedLessons.filter((l) => {
      if (q) {
        const match = l.title.toLowerCase().includes(q) ||
          l.rabbiName.toLowerCase().includes(q) ||
          (l.category ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (rabbiFilter && l.rabbiName !== rabbiFilter) return false;
      if (categoryFilter && l.category !== categoryFilter) return false;
      if (typeFilter && l.broadcastType !== typeFilter) return false;
      if (languageFilter && l.language !== languageFilter) return false;
      return true;
    });
  }, [enrichedLessons, filter, rabbiFilter, categoryFilter, typeFilter, languageFilter]);

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
          {/* רקע מבוסס gradient — בלי תמונה חיצונית. שומר על גוון חם-זהוב מבדיל */}
          <div className="absolute inset-0 bg-gradient-to-b from-paper-warm via-paper-soft to-paper-warm pointer-events-none" aria-hidden="true" />
        </>
      )}
      <div className={cn(compact ? "" : "relative max-w-6xl mx-auto px-4")}>
      {/* === מסגרת חיצונית: עוטפת כותרת + חיפוש + לוח === */}
      <div className={cn(!compact && "bg-white/75 backdrop-blur-md border-2 border-gold/25 rounded-[20px] shadow-card p-5 sm:p-8 lg:p-10")}>
      {!compact && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-3">
            <span className="w-12 h-0.5 bg-gold/50" />
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight">{title}</h2>
            <span className="w-12 h-0.5 bg-gold/50" />
          </div>
          <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">שיעורים, תפילות ואירועים קרובים</p>
        </div>
      )}

      {/* סרגל פילטרים — כרטיס בולט עם מסגרת זהב + Header צבעוני */}
      {!compact && (
        <div className="max-w-5xl mx-auto mb-6 bg-white border-2 border-gold/40 rounded-card shadow-card overflow-hidden">
          {/* Header רצועה זהב */}
          <div className="bg-gradient-to-l from-gold-soft via-gold-soft/40 to-transparent border-b border-gold/20 px-4 sm:px-5 py-2.5 flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold/15">
              <Filter className="w-4 h-4 text-gold" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-ink">סינון וחיפוש בלוח</h3>
            <span className="mr-auto inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-1">
              {filteredLessons.length} / {lessons.length}
            </span>
          </div>

          {/* גוף הפילטרים */}
          <div className="p-4 sm:p-5 space-y-3">

          {/* שורה 1: חיפוש קצר + chips סוג + toggle תצוגה */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="חיפוש..."
                className="w-full h-10 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none shadow-soft"
              />
            </div>

            <div className="flex gap-1 flex-wrap">
              {BROADCAST_TYPES.map((t) => {
                const active = typeFilter === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTypeFilter(active ? "" : t.value)}
                    className={`h-10 px-3 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-primary text-white border-primary shadow-soft"
                        : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"
                    }`}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1 p-1 bg-white rounded-btn border border-border shadow-soft mr-auto" role="group" aria-label="תצוגה">
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
                  className={`h-8 px-3 text-sm font-medium rounded-btn transition ${
                    viewMode === opt.v ? "bg-primary text-white" : "text-ink-soft hover:text-ink"
                  }`}
                  aria-pressed={viewMode === opt.v}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* שורה 2: רב · נושא · שפה · נקה — מוצגת רק אם יש 2+ אופציות בכלל אחד */}
          {(rabbiOptions.length > 1 || categoryOptions.length > 0 || availableLanguages.length > 1 || hasActiveFilter) && (
            <div className="flex gap-2 flex-wrap items-center">
              {rabbiOptions.length > 1 && (
                <select value={rabbiFilter} onChange={(e) => setRabbiFilter(e.target.value)}
                  className={`h-9 px-3 rounded-btn border text-sm bg-white transition ${rabbiFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                  aria-label="רב">
                  <option value="">רב · כולם</option>
                  {rabbiOptions.map(([name, count]) => (
                    <option key={name} value={name}>{name} ({count})</option>
                  ))}
                </select>
              )}

              {categoryOptions.length > 0 && (
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`h-9 px-3 rounded-btn border text-sm bg-white transition ${categoryFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                  aria-label="נושא">
                  <option value="">נושא · הכל</option>
                  {categoryOptions.map(([cat, count]) => (
                    <option key={cat} value={cat}>{cat} ({count})</option>
                  ))}
                </select>
              )}

              {availableLanguages.length > 1 && (
                <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
                  className={`h-9 px-3 rounded-btn border text-sm bg-white transition ${languageFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                  aria-label="שפה">
                  <option value="">שפה · הכל</option>
                  {availableLanguages.map((code) => (
                    <option key={code} value={code}>{languageLabel(code) || code}</option>
                  ))}
                </select>
              )}

              {hasActiveFilter && (
                <button type="button" onClick={clearAll}
                  className="h-9 px-3 rounded-btn text-sm text-primary hover:underline font-medium mr-auto">
                  נקה סינון
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* ניווט בין תקופות + שיתוף/הדפסה */}
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
        {/* פעולות שיתוף — לא מודפסות עצמן */}
        <div className="flex items-center gap-1 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-btn border border-border bg-white text-sm text-ink-soft hover:border-primary hover:text-primary"
            title="הדפסת הלוח"
            aria-label="הדפסת הלוח"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">הדפסה</span>
          </button>
          <a
            href={buildWhatsappShareUrl(filteredLessons, gridDays, rangeLabel, title)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 h-9 px-3 rounded-btn border border-[#25D366]/40 bg-[#25D366]/5 text-sm text-[#1E8E47] hover:bg-[#25D366]/15"
            title="שלח לוח ב-WhatsApp עם קישורים וקודי שידור"
            aria-label="שלח ב-WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
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
            const seminars = dayLessons.filter((l) => l.broadcastType === "SEMINAR");
            const nonSeminars = dayLessons.filter((l) => l.broadcastType !== "SEMINAR");
            return (
              <div key={i} className={cn(
                "rounded-card border overflow-hidden",
                seminars.length > 0 ? "border-purple-400 shadow-card" :
                holiday ? "border-gold/30" : isSabbath ? "border-border" : isToday ? "border-primary" : "border-border"
              )}>
                <div className={cn(
                  "px-3 py-2 flex items-center justify-between gap-2",
                  seminars.length > 0 ? "bg-gradient-to-l from-purple-600 to-purple-500 text-white" :
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
                  {/* באנר ימי עיון — מודגש בראש היום */}
                  {seminars.map((l) => (
                    <Link
                      key={l.id}
                      href={l.href ?? `/lesson/${l.id}`}
                      className="block rounded-btn border-2 border-purple-400 bg-gradient-to-l from-purple-600 to-purple-500 text-white p-2.5 hover:shadow-card transition"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span aria-hidden>📜</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">יום עיון</span>
                        <span className="mr-auto text-xs opacity-90 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeRange(l.scheduledAt, l.durationMin ?? null)}
                        </span>
                      </div>
                      <div className="font-bold text-sm leading-tight">{l.title}</div>
                      <div className="text-xs opacity-80 mt-0.5">{l.rabbiName}</div>
                    </Link>
                  ))}
                  {nonSeminars.map((l) => {
                    const variant = resolveVariant(l);
                    const cls = variant === "live"
                      ? "bg-live/10 text-live border-live/20"
                      : variant === "event"
                        ? "bg-gold-soft text-gold border-gold/40 font-semibold"
                        : "bg-primary-soft text-primary border-primary/20";
                    return (
                      <div key={l.id} className={cn("relative rounded-btn border", cls)}>
                        <Link href={l.href ?? `/lesson/${l.id}`} className="block p-2 pe-9 text-sm leading-tight transition active:scale-[0.98]">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-semibold flex items-center gap-1">
                              {variant === "event" && <span>🎪</span>}
                              <Clock className="w-3 h-3 shrink-0" />
                              {formatTimeRange(l.scheduledAt, l.durationMin ?? null)}
                            </span>
                            {l.isLive && <span className="text-xs font-bold inline-flex items-center gap-1 text-live"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />LIVE</span>}
                          </div>
                          <div className="font-medium line-clamp-2 mb-0.5">{l.title}</div>
                          <div className="text-xs opacity-75 truncate">{l.rabbiName}</div>
                        </Link>
                        {/* כפתור הוספה ללוח שלי — overlay, פעיל רק לתלמיד מחובר */}
                        {canBookmark && (
                          <div className="absolute top-1.5 end-1.5">
                            <CalendarBookmarkIcon lessonId={l.id} initialBookmarked={!!l.bookmarked} canBookmark={canBookmark} />
                          </div>
                        )}
                      </div>
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
          // ימי עיון של היום — מודגשים בכותרת היום עם פוסטר ועיצוב מיוחד
          const seminars = dayLessons.filter((l) => l.broadcastType === "SEMINAR");
          const nonSeminars = dayLessons.filter((l) => l.broadcastType !== "SEMINAR");

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] sm:min-h-[120px] rounded-card border p-2 transition",
                // רקע
                seminars.length > 0
                  ? "bg-gradient-to-b from-purple-50 to-white border-purple-300 shadow-soft"
                  : holiday
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

              {/* === באנר יום עיון — מודגש בכותרת היום === */}
              {seminars.map((l) => (
                <Link
                  key={l.id}
                  href={l.href ?? `/lesson/${l.id}`}
                  className="block mb-1.5 rounded-btn border border-purple-400 bg-gradient-to-l from-purple-600 to-purple-500 text-white p-1.5 hover:shadow-card transition group"
                  title={`יום עיון: ${l.title}`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px]" aria-hidden>📜</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-90">יום עיון</span>
                  </div>
                  <div className="font-bold text-[11px] leading-tight line-clamp-2 group-hover:underline">{l.title}</div>
                  <div className="flex items-center gap-1 text-[10px] opacity-90 mt-0.5">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {formatTimeRange(l.scheduledAt, l.durationMin ?? null)}
                  </div>
                </Link>
              ))}

              {/* שיעורים — מיון: אירועים ארוכים למעלה, שידורים חיים אחריהם, שיעורים רגילים */}
              <div className="space-y-1">
                {(() => {
                  // מיון: events קודם (ארוך יותר), אז live, אז lessons. ימי עיון מוצגים נפרד בכותרת.
                  const sorted = [...nonSeminars].sort((a, b) => {
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
                          <div key={l.id} className={cn("relative rounded-btn", cls)}>
                            <Link
                              href={l.href ?? `/lesson/${l.id}`}
                              className="block p-1.5 pe-6 text-[11px] leading-tight transition hover:shadow-soft"
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
                            {/* כפתור הוספה ללוח שלי — גם בתצוגת הגריד */}
                            {canBookmark && (
                              <div className="absolute top-1 end-1">
                                <CalendarBookmarkIcon lessonId={l.id} initialBookmarked={!!l.bookmarked} canBookmark={canBookmark} />
                              </div>
                            )}
                          </div>
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
      </div> {/* סגירת מסגרת חיצונית */}
      </div>
    </section>
  );
}
