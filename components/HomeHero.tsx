// HomeHero — חלק עליון של דף הבית, מסך מלא, "first impression" של האתר.
// מותאם ל-3 מצבים:
//   1. LIVE: שיעור משדר עכשיו → CTA ראשי "צפה עכשיו" + אינדיקטור LIVE pulsing.
//   2. UPCOMING: השיעור הקרוב הבא → CTA "פרטי השיעור הבא" + countdown.
//   3. DEFAULT: אין שידור קרוב → CTA "גלה את הרבנים".
// בכל מצב: CTA משני "אני רב — צרף אותי" → /register?role=rabbi (חיוני לשיווק).
//
// עיצוב: full-bleed background image + dual gradient overlay, כותרת Frank Ruhl
// Libre בגדול, הרבה whitespace, **CTA ראשי אחד** בולט (לא 5 שמתחרים).

import Link from "next/link";
import { Play, ChevronLeft, Mic, Sparkles } from "lucide-react";

export type HeroLive = {
  id: string;
  title: string;
  rabbiName: string;
};

export type HeroUpcoming = {
  id: string;
  title: string;
  rabbiName: string;
  scheduledAt: string; // ISO
};

export function HomeHero({
  live,
  upcoming,
}: {
  live?: HeroLive | null;
  upcoming?: HeroUpcoming | null;
}) {
  const isLive = !!live;
  const hasUpcoming = !!upcoming && !isLive;

  // CTA ראשי לפי מצב. רק אחד — מונע התלבטות
  let primaryCta: { href: string; label: string; IconLeft: typeof Play | null; arrowRight?: boolean } = {
    href: "/rabbis",
    label: "גלה את הרבנים",
    IconLeft: null,
    arrowRight: true,
  };
  if (isLive && live) {
    primaryCta = { href: `/lesson/${live.id}`, label: "צפה עכשיו", IconLeft: Play };
  } else if (hasUpcoming && upcoming) {
    primaryCta = { href: `/lesson/${upcoming.id}`, label: "פרטי השיעור הבא", IconLeft: null, arrowRight: true };
  }

  // ניסוח זמן עתידי
  let upcomingTimeLabel = "";
  if (upcoming) {
    const ms = new Date(upcoming.scheduledAt).getTime() - Date.now();
    if (ms > 0) {
      const min = Math.floor(ms / 60_000);
      const hours = Math.floor(min / 60);
      const days = Math.floor(hours / 24);
      if (days >= 1) upcomingTimeLabel = `בעוד ${days} ${days === 1 ? "יום" : "ימים"}`;
      else if (hours >= 1) upcomingTimeLabel = `בעוד ${hours} ${hours === 1 ? "שעה" : "שעות"}`;
      else upcomingTimeLabel = "בקרוב מאוד";
    }
  }

  const PrimaryIcon = primaryCta.IconLeft;

  return (
    <section className="relative isolate overflow-hidden" aria-label="פתיחה — הבית הדיגיטלי של רבני ישראל">
      {/* === רקעים === */}
      {/* תמונת אבני ירושלים / זריחה — נופך זהוב חם */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544734037-5a3b4b7e0a3d?w=1920&q=80')",
        }}
        aria-hidden="true"
      />
      {/* gradient כהה לקריאות */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-900/95"
        aria-hidden="true"
      />
      {/* כתמי אור דקורטיביים */}
      <div
        className="absolute -top-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />

      {/* === תוכן === */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
        {/* Eyebrow chip — מצב נוכחי */}
        {isLive && live && (
          <Link
            href={`/lesson/${live.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-live/15 border border-live/40 text-emerald-300 backdrop-blur-sm text-sm font-semibold hover:bg-live/25 transition mb-6 group"
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span>כרגע משדר: הרב {live.rabbiName}</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          </Link>
        )}
        {!isLive && hasUpcoming && upcoming && upcomingTimeLabel && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/40 text-amber-200 backdrop-blur-sm text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>השיעור הבא {upcomingTimeLabel}</span>
          </div>
        )}
        {!isLive && !hasUpcoming && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm text-sm font-medium mb-6">
            <Mic className="w-3.5 h-3.5" />
            <span>הבית הדיגיטלי של רבני ישראל</span>
          </div>
        )}

        {/* === כותרת ראשית — Frank Ruhl Libre === */}
        <h1 className="font-display font-bold text-white leading-[1.05] tracking-tight text-4xl sm:text-6xl lg:text-7xl">
          כל רבני ישראל.
          <br />
          <span className="text-amber-300">מקום אחד.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          שיעורי תורה בשידור חי, ארכיון פתוח, וחיבור ישיר לרבני הקהילות —
          הכל באתר אחד, חינם, וללא הרשמה.
        </p>

        {/* פרטי השיעור הנוכחי/הבא — רק כשרלוונטי */}
        {(isLive || hasUpcoming) && (
          <div className="mt-6 inline-block max-w-xl">
            <p className="font-display text-amber-200/95 text-lg sm:text-xl font-medium">
              {(live ?? upcoming)!.title}
            </p>
            <p className="text-white/60 text-sm mt-1">
              {(live ?? upcoming)!.rabbiName}
            </p>
          </div>
        )}

        {/* === CTAs === */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          {/* Primary CTA — זהב, גדול, אחד */}
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-btn bg-amber-500 hover:bg-amber-400 text-slate-900 text-base sm:text-lg font-bold shadow-card transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 w-full sm:w-auto"
          >
            {PrimaryIcon && <PrimaryIcon className="w-5 h-5 fill-current" />}
            <span>{primaryCta.label}</span>
            {primaryCta.arrowRight && <ChevronLeft className="w-5 h-5" />}
          </Link>
          {/* Secondary CTA — לרבנים. שיווק */}
          <Link
            href="/register?role=rabbi"
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-btn bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white text-base sm:text-lg font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 w-full sm:w-auto"
          >
            <Mic className="w-5 h-5" />
            אני רב — צרף אותי
          </Link>
        </div>

        {/* רמז גלילה ללוח השיעורים */}
        <a
          href="#calendar"
          className="hidden sm:inline-flex items-center gap-2 mt-12 text-xs text-white/50 hover:text-white/80 transition group"
          aria-label="גלילה ללוח השיעורים"
        >
          <span>לוח השיעורים השבועי</span>
          <span className="block w-5 h-5 rounded-full border border-current animate-bounce group-hover:animate-none flex items-center justify-center" aria-hidden>
            <span className="block w-1 h-1 rounded-full bg-current" />
          </span>
        </a>
      </div>
    </section>
  );
}
