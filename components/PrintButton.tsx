"use client";

// כפתור הדפסה קטן — client island. מאפשר לקרוא window.print() מתוך RSC.
import { Printer } from "lucide-react";

export function PrintButton({ label = "הדפסה" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1 text-ink-muted hover:text-primary"
      aria-label={label}
    >
      <Printer className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
