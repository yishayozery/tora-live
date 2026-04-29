"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, Calendar as CalIcon, X } from "lucide-react";
import { toHebrewNumeral } from "@/lib/utils";
import { getHebrewHoliday } from "@/lib/hebrew-dates";

const HEBREW_DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

/**
 * בורר תאריך עם תצוגה עברית מלאה.
 * ערך פנימי = ISO string (YYYY-MM-DD) — תואם API ו-DB.
 * תצוגה = שמות חודשים עבריים, מספרי ימים בגימטריה.
 *
 * הניווט בחודשים מבוסס לועזי (כי JS Date מבוסס לועזי), אבל הכותרת
 * מציגה את החודש העברי הראשי שמכוסה ע"י החודש הלועזי.
 */
export function HebrewDatePicker({
  value,
  onChange,
  required,
  minDate,
  placeholder = "בחר תאריך",
  label,
  min, // backwards compat
}: {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  minDate?: string;
  placeholder?: string;
  label?: string;
  min?: string;
}) {
  const effectiveMin = minDate ?? min;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startSunday = new Date(firstOfMonth);
  startSunday.setDate(1 - firstOfMonth.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startSunday);
    d.setDate(startSunday.getDate() + i);
    cells.push(d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDateObj = effectiveMin ? new Date(effectiveMin) : null;
  if (minDateObj) minDateObj.setHours(0, 0, 0, 0);

  const selected = value ? new Date(value) : null;
  if (selected) selected.setHours(0, 0, 0, 0);

  // כותרת בעברית
  const heMonth1 = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" }).format(firstOfMonth);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const heMonth2 = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" }).format(lastDayOfMonth);
  const heYearStr = new Intl.DateTimeFormat("en-US-u-ca-hebrew", { year: "numeric" }).format(firstOfMonth);
  const heYear = toHebrewNumeral(parseInt(heYearStr, 10) % 1000);
  const heHeader = heMonth1 === heMonth2 ? `${heMonth1} ${heYear}` : `${heMonth1}–${heMonth2} ${heYear}`;
  const grHeader = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(firstOfMonth);

  function selectDay(d: Date) {
    if (minDateObj && d < minDateObj) return;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  function changeMonth(delta: number) {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + delta);
    setViewDate(next);
  }

  let buttonLabel = placeholder;
  if (selected) {
    const dayHe = toHebrewNumeral(parseInt(new Intl.DateTimeFormat("en-US-u-ca-hebrew", { day: "numeric" }).format(selected), 10));
    const monthHe = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" }).format(selected);
    const yrHe = toHebrewNumeral(parseInt(new Intl.DateTimeFormat("en-US-u-ca-hebrew", { year: "numeric" }).format(selected), 10) % 1000);
    const wd = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(selected);
    buttonLabel = `יום ${wd}, ${dayHe} ב${monthHe} ${yrHe}`;
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm text-ink-soft mb-1 font-medium">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-11 px-3 rounded-btn border text-sm text-right flex items-center gap-2 transition ${
          selected ? "border-primary text-ink bg-white font-medium" : "border-border text-ink-muted bg-white"
        } focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalIcon className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 truncate text-right">{buttonLabel}</span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-ink-muted hover:text-danger"
            aria-label="נקה"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {required && <input type="hidden" required value={value} onChange={() => {}} />}

      {open && (
        <div className="absolute z-50 mt-1 w-[20rem] rounded-card border border-border bg-white shadow-card overflow-hidden right-0">
          <div className="bg-primary-soft/50 border-b border-border px-3 py-2 flex items-center justify-between">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-white/50" aria-label="חודש קודם">
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
            <div className="text-center">
              <div className="hebrew-serif text-base font-bold text-ink leading-tight">{heHeader}</div>
              <div className="text-[10px] text-ink-muted">{grHeader}</div>
            </div>
            <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-white/50" aria-label="חודש הבא">
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-bold text-ink-muted py-1.5 bg-paper-soft">
            {HEBREW_DAYS.map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border p-px">
            {cells.map((d, i) => {
              const isCurMonth = d.getMonth() === month;
              const isToday = d.getTime() === today.getTime();
              const isSelected = !!selected && d.getTime() === selected.getTime();
              const isDisabled = !!minDateObj && d < minDateObj;
              const isShabbat = d.getDay() === 6;
              const holiday = getHebrewHoliday(d);
              const dayHe = toHebrewNumeral(parseInt(new Intl.DateTimeFormat("en-US-u-ca-hebrew", { day: "numeric" }).format(d), 10));
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  disabled={isDisabled}
                  title={holiday || undefined}
                  className={`h-9 text-sm relative transition ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : isToday
                        ? "bg-primary-soft text-primary font-bold"
                        : isDisabled
                          ? "bg-paper-soft text-ink-muted/40 cursor-not-allowed"
                          : !isCurMonth
                            ? "bg-white text-ink-muted/50 hover:bg-paper-soft"
                            : holiday
                              ? "bg-gold-soft/40 text-ink hover:bg-gold-soft"
                              : isShabbat
                                ? "bg-paper-warm/50 text-ink-muted hover:bg-paper-warm"
                                : "bg-white text-ink hover:bg-primary-soft/50"
                  }`}
                >
                  {dayHe}
                  {holiday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => selectDay(today)}
              className="text-primary font-medium hover:underline"
            >
              היום
            </button>
            <div className="flex items-center gap-2 text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gold" /> חג
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
