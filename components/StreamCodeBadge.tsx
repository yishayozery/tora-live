"use client";

import { useState } from "react";
import { Copy, Check, Share2, KeyRound } from "lucide-react";

type Props = {
  code: string;
  lessonTitle: string;
  lessonUrl: string; // קישור מלא לעמוד השיעור (לשיתוף)
};

export function StreamCodeBadge({ code, lessonTitle, lessonUrl }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const waText = encodeURIComponent(
    `שלום! קוד פתיחת השידור לשיעור "${lessonTitle}":\n\n${code}\n\nקישור לעמוד השיעור:\n${lessonUrl}\n\nכניסה לעמוד → "התחל שידור" → הזנת הקוד.`,
  );

  return (
    <div className="rounded-card border border-gold/40 bg-gold/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4 text-gold" aria-hidden />
        <span className="text-xs font-semibold text-ink">קוד פתיחת שידור</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="font-mono text-base font-bold text-ink bg-white border border-gold/30 rounded px-2 py-1" dir="ltr">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 h-8 px-2 rounded-btn text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="העתק קוד"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-live" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "הועתק" : "העתק"}
        </button>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-8 px-2 rounded-btn text-xs font-semibold text-primary hover:bg-primary/5"
        >
          <Share2 className="w-3.5 h-3.5" />
          שלח ב-WhatsApp
        </a>
      </div>
      <p className="text-[11px] text-ink-muted mt-2 leading-relaxed">
        מי שיש לו את הקוד יכול לפתוח את השידור (בלי התחברות) מהעמוד הציבורי, בחלון של שעה לפני ועד 30 דקות אחרי סיום השיעור.
      </p>
    </div>
  );
}
