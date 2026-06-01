"use client";

// כפתור "הורד PDF" — תופס element ספציפי ב-DOM ומייצר ממנו PDF.
// משתמש ב-html2pdf.js (client-only, dynamic import) כדי להימנע מבעיות SSR
// וגם להוציא את הספרייה הכבדה (~150KB) רק מהדפים שצריכים אותה.

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function DownloadLetterPdfButton({
  /** סלקטור של ה-element שירוקם ל-PDF (ברירת מחדל: #letter-body) */
  targetSelector = "#letter-body",
  /** שם קובץ ההורדה (בלי סיומת) */
  filename = "TANA-letter-to-rabbi",
  /** טקסט הכפתור */
  label = "הורד PDF",
}: {
  targetSelector?: string;
  filename?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const target = document.querySelector(targetSelector) as HTMLElement | null;
      if (!target) {
        console.error(`[pdf] target not found: ${targetSelector}`);
        return;
      }
      // Dynamic import — html2pdf.js הוא ~150KB, לא רוצים בכל הדפים
      const html2pdf = (await import("html2pdf.js")).default;
      const opts = {
        margin: [12, 12, 12, 12] as [number, number, number, number],
        filename: `${filename}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] as Array<"css" | "legacy"> },
      };
      await html2pdf().set(opts).from(target).save();
    } catch (e) {
      console.error("[pdf] generation failed:", e);
      alert("שגיאה ביצירת ה-PDF. ניתן להשתמש בהדפסה ולשמור כ-PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary hover:bg-primary-hover text-white text-sm sm:text-base font-semibold shadow-soft transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-60"
      aria-label="הורד את המכתב כקובץ PDF"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {busy ? "מייצר PDF..." : label}
    </button>
  );
}
