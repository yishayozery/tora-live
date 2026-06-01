"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowLeft } from "lucide-react";

const STORAGE_KEY = "TANA:share_kit_banner_seen";

export function OnboardingBanner({ rabbiName }: { rabbiName: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setShow(true);
    } catch {
      // localStorage חסום — לא מציגים
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="relative rounded-card border border-primary/30 bg-gradient-to-l from-primary-soft via-white to-gold-soft/40 p-5 shadow-soft">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 left-2 p-1.5 rounded-full text-ink-muted hover:bg-white/60 hover:text-ink transition"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pl-8">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink hebrew-serif text-lg">
            ברוך הבא, {rabbiName}! הדף שלך מוכן 🎉
          </div>
          <p className="text-sm text-ink-soft mt-1">
            השלב הבא — להפיץ אותו לקהילה. הכנו לך ערכת שיתוף עם הודעות מוכנות, קישורים ו-QR.
          </p>
          <Link
            href="/dashboard/share-kit"
            onClick={dismiss}
            className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-primary text-white hover:bg-primary-hover font-medium text-sm"
          >
            לראות איך לשתף
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
