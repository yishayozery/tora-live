"use client";

import { useState } from "react";

/**
 * שדה תאריך עם הצגת התאריך העברי כראשי.
 * משאיר את ה-input מסוג date (לאחסון Gregorian) אבל הופך את הלוח העברי לבולט.
 */
export function DedicationDateField() {
  const [value, setValue] = useState(() => new Date().toISOString().slice(0, 10));

  let hebrew = "";
  let gregorian = "";
  try {
    const d = new Date(value);
    hebrew = new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
    gregorian = new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {}

  return (
    <div>
      {/* תצוגה עברית בולטת */}
      {hebrew && (
        <div className="rounded-btn border-2 border-gold/40 bg-gold-soft/40 px-3 py-2.5 mb-2">
          <div className="hebrew-serif text-lg font-bold text-ink leading-tight">
            📅 {hebrew}
          </div>
          {gregorian && (
            <div className="text-xs text-ink-muted mt-0.5">{gregorian}</div>
          )}
        </div>
      )}
      <input
        id="dedicateDate"
        name="dedicateDate"
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-sm"
      />
      <p className="text-xs text-ink-muted mt-1">בחר תאריך מהלוח</p>
    </div>
  );
}
