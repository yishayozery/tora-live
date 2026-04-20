"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { formatHebrewCalendarDate } from "@/lib/hebrew-dates";

type Props = {
  /** ISO date string (YYYY-MM-DD) — מצב הנוכחי של השדה */
  value: string;
  /** callback לעדכון ISO */
  onChange: (iso: string) => void;
  /** label לשדה הגרגוריאני */
  label?: string;
  /** min date (ISO) */
  min?: string;
};

const HEBREW_MONTHS = [
  "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳",
  "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול",
];

// בגימטריה — 1..30
function gematria(n: number): string {
  if (n < 1 || n > 30) return String(n);
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל"];
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";
  const t = Math.floor(n / 10);
  const o = n % 10;
  const tPart = tens[t] ?? "";
  const oPart = ones[o] ?? "";
  if (tPart && oPart) return `${tPart}״${oPart}`;
  return tPart + oPart;
}

/** חיפוש תאריך גרגוריאני שמתאים לתאריך עברי נתון (ב-2 שנים הקרובות) */
function hebrewToGregorian(day: number, monthName: string): Date | null {
  const today = new Date();
  const now = today.getTime();
  // סרוק 730 יום קדימה
  for (let i = 0; i < 800; i++) {
    const d = new Date(now + i * 86400_000);
    try {
      const fmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" }).format(d);
      const dayFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" }).format(d);
      const monthFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" }).format(d);
      // Day match: compare as numbers (iterate over "1" "א" etc)
      const expectedDayHe = gematria(day);
      if (dayFmt === expectedDayHe && monthFmt === monthName) {
        return d;
      }
    } catch {}
  }
  return null;
}

export function HebrewDatePicker({ value, onChange, label = "תאריך", min }: Props) {
  const [mode, setMode] = useState<"gregorian" | "hebrew">("gregorian");
  const [heDay, setHeDay] = useState<number>(1);
  const [heMonth, setHeMonth] = useState<string>("ניסן");

  const hebrewPreview = useMemo(() => {
    if (!value) return "";
    try {
      return formatHebrewCalendarDate(new Date(value));
    } catch {
      return "";
    }
  }, [value]);

  // Convert Hebrew → Gregorian when user changes
  useEffect(() => {
    if (mode !== "hebrew") return;
    const d = hebrewToGregorian(heDay, heMonth);
    if (d) {
      const iso = d.toISOString().slice(0, 10);
      if (iso !== value) onChange(iso);
    }
  }, [mode, heDay, heMonth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-ink-soft flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setMode(mode === "gregorian" ? "hebrew" : "gregorian")}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <RefreshCw className="w-3 h-3" />
          {mode === "gregorian" ? "בחר לפי לוח עברי" : "בחר לפי לוח לועזי"}
        </button>
      </div>

      {mode === "gregorian" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          dir="ltr"
          className="w-full h-11 px-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <select value={heDay} onChange={(e) => setHeDay(Number(e.target.value))} className="h-11 px-3 rounded-btn border border-border bg-white text-sm">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{gematria(d)} ({d})</option>
            ))}
          </select>
          <select value={heMonth} onChange={(e) => setHeMonth(e.target.value)} className="h-11 px-3 rounded-btn border border-border bg-white text-sm">
            {HEBREW_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {hebrewPreview && (
        <div className="mt-1.5 text-xs text-gold bg-gold-soft border border-gold/30 rounded-btn px-2.5 py-1">
          📅 בלוח עברי: <strong>{hebrewPreview}</strong>
        </div>
      )}
    </div>
  );
}
