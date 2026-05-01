"use client";

import { useState } from "react";
import { formatHebrewDateWithWeekday } from "@/lib/utils";
import { HebrewDatePicker } from "@/components/HebrewDatePicker";

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
    hebrew = formatHebrewDateWithWeekday(d, true);
    gregorian = new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {}

  return (
    <div>
      <HebrewDatePicker
        value={value}
        onChange={setValue}
        placeholder="בחר תאריך הקדשה"
      />
      {/* hidden input ל-form serialization */}
      <input
        id="dedicateDate"
        name="dedicateDate"
        type="hidden"
        value={value}
        readOnly
      />
      <p className="text-xs text-ink-muted mt-1">לחץ לפתיחת לוח עברי</p>
    </div>
  );
}
