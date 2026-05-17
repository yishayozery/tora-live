"use client";

// בורסת ההקדשות — רצועה מתגלגלת של תרומות "showPublicly".
// דסקטופ: עמודה אנכית sticky בצד, גלילה איטית כלפי מעלה.
// מובייל: marquee אופקית למטה בעמוד הראשי.
// העיצוב: כרטיסים מעוטרים בזהב/סגול/ירוק לפי סוג ההקדשה,
// hebrew-serif לכותרת השם, אנימציה רכה במחזור אינסופי.

import { useEffect, useState, useRef } from "react";
import { Heart, Sparkles, HandHeart } from "lucide-react";

export type DedicationEntry = {
  id: string;
  type: "LEZECHER" | "LIZCHUT" | "LIRFUA" | string;
  name: string;
  donorName?: string | null;
  amount?: number | null;
  createdAt: string; // ISO
};

const TYPE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  border: string;
  text: string;
  badgeBg: string;
}> = {
  LEZECHER: {
    label: "לעילוי נשמת",
    icon: Sparkles,
    gradient: "from-purple-50 to-white",
    border: "border-purple-200",
    text: "text-purple-700",
    badgeBg: "bg-purple-100",
  },
  LIZCHUT: {
    label: "לזכות",
    icon: Heart,
    gradient: "from-amber-50 to-white",
    border: "border-amber-200",
    text: "text-amber-700",
    badgeBg: "bg-amber-100",
  },
  LIRFUA: {
    label: "לרפואת",
    icon: HandHeart,
    gradient: "from-emerald-50 to-white",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-100",
  },
};

function metaFor(type: string) {
  return TYPE_META[type] ?? TYPE_META.LIZCHUT;
}

function DedicationCard({ d, compact = false }: { d: DedicationEntry; compact?: boolean }) {
  const meta = metaFor(d.type);
  const Icon = meta.icon;
  return (
    <div
      className={`shrink-0 rounded-card border ${meta.border} bg-gradient-to-b ${meta.gradient} px-3 py-2.5 shadow-soft hover:shadow-card transition ${
        compact ? "w-56" : "w-full"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${meta.badgeBg}`}>
          <Icon className={`w-3 h-3 ${meta.text}`} aria-hidden="true" />
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>
          {meta.label}
        </span>
      </div>
      <div className="hebrew-serif font-bold text-ink text-[13px] leading-tight line-clamp-2">
        {d.name}
      </div>
      {d.donorName && (
        <div className="mt-1 text-[10px] text-ink-muted truncate">
          ע״י {d.donorName}
        </div>
      )}
    </div>
  );
}

/**
 * עמודה אנכית — sticky בצד הימני בדסקטופ.
 * גלילה אוטומטית במחזור אינסופי (CSS @keyframes על container עם רשימה כפולה).
 * עוצרת ב-hover כדי שאפשר לקרוא.
 */
export function DonationTickerVertical({ donations }: { donations: DedicationEntry[] }) {
  if (donations.length === 0) return null;
  // משכפלים את הרשימה כדי שהאנימציה תמשיך חלק במחזור
  const doubled = [...donations, ...donations];
  // זמן: 4 שניות לכרטיס. אם יש הרבה תרומות — לא להיות מהיר מדי, מעלים את הזמן.
  const durationSec = Math.max(30, donations.length * 4);

  return (
    <aside
      className="hidden xl:block fixed left-4 top-32 z-20 w-60 max-h-[calc(100vh-10rem)] overflow-hidden"
      aria-label="לוח הקדשות מתגלגל"
    >
      <div className="rounded-card border-2 border-gold/40 bg-white shadow-card overflow-hidden">
        <header className="bg-gradient-to-l from-gold to-amber-500 text-white px-3 py-2 flex items-center gap-2">
          <Heart className="w-4 h-4 fill-white" />
          <h3 className="hebrew-serif font-bold text-sm">לוח הקדשות</h3>
          <span className="mr-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            {donations.length}
          </span>
        </header>
        <div
          className="relative h-[calc(100vh-16rem)] overflow-hidden ticker-mask"
          onMouseEnter={(e) => {
            const inner = e.currentTarget.firstElementChild as HTMLElement | null;
            if (inner) inner.style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            const inner = e.currentTarget.firstElementChild as HTMLElement | null;
            if (inner) inner.style.animationPlayState = "running";
          }}
        >
          <div
            className="space-y-2 p-2 will-change-transform"
            style={{
              animation: `ticker-vertical ${durationSec}s linear infinite`,
            }}
          >
            {doubled.map((d, i) => (
              <DedicationCard key={`${d.id}-${i}`} d={d} />
            ))}
          </div>
        </div>
        <footer className="border-t border-border bg-paper-soft px-3 py-2 text-center">
          <a
            href="/donate"
            className="text-xs font-semibold text-gold hover:text-ink hover:underline underline-offset-4"
          >
            הוסף הקדשה ←
          </a>
        </footer>
      </div>

      <style jsx>{`
        @keyframes ticker-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .ticker-mask {
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent);
          mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent);
        }
      `}</style>
    </aside>
  );
}

/**
 * רצועה אופקית — מובייל ודסקטופ צר.
 * זרימה מימין לשמאל (RTL), עצירה ב-hover.
 */
export function DonationTickerHorizontal({ donations }: { donations: DedicationEntry[] }) {
  if (donations.length === 0) return null;
  const doubled = [...donations, ...donations];
  const durationSec = Math.max(30, donations.length * 5);

  return (
    <section
      className="xl:hidden bg-gradient-to-l from-gold-soft via-amber-50 to-gold-soft border-y border-gold/30 py-3"
      aria-label="הקדשות תורמים"
    >
      <div className="max-w-6xl mx-auto px-4 mb-2 flex items-center gap-2">
        <Heart className="w-4 h-4 text-gold fill-gold" />
        <h3 className="hebrew-serif font-bold text-sm text-ink">לוח הקדשות</h3>
        <span className="text-[10px] bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-bold">
          {donations.length}
        </span>
        <a
          href="/donate"
          className="mr-auto text-xs font-semibold text-gold hover:text-ink hover:underline underline-offset-4"
        >
          הוסף הקדשה ←
        </a>
      </div>
      <div
        className="relative overflow-hidden ticker-mask-h"
        onMouseEnter={(e) => {
          const inner = e.currentTarget.firstElementChild as HTMLElement | null;
          if (inner) inner.style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          const inner = e.currentTarget.firstElementChild as HTMLElement | null;
          if (inner) inner.style.animationPlayState = "running";
        }}
      >
        <div
          className="flex gap-3 px-4 will-change-transform"
          style={{
            animation: `ticker-horizontal ${durationSec}s linear infinite`,
            // RTL: זזים שמאלה אבל הכרטיס הראשון מימין
            direction: "ltr",
          }}
        >
          {doubled.map((d, i) => (
            <DedicationCard key={`${d.id}-${i}`} d={d} compact />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-mask-h {
          -webkit-mask-image: linear-gradient(to left, transparent, black 5%, black 95%, transparent);
          mask-image: linear-gradient(to left, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </section>
  );
}

/** קומפוננטה משולבת — מציגה גרסה לפי גודל מסך */
export function DonationTicker({ donations }: { donations: DedicationEntry[] }) {
  return (
    <>
      <DonationTickerVertical donations={donations} />
      <DonationTickerHorizontal donations={donations} />
    </>
  );
}
