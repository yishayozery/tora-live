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
import { Play, ChevronLeft, Sparkles } from "lucide-react";

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
      {/* רקע צבעוני מבוסס gradient — ללא תמונה חיצונית. מונע שבירת תמונה ונותן מראה מכוון */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-hover/90"
        aria-hidden="true"
      />
      {/* טקסטורת רעש עדינה דרך radial gradients — מוסיף עומק */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,134,47,0.18),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(30,64,175,0.25),transparent_55%)]"
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
      {/* Hero קומפקטי: השידורים החיים חייבים להופיע מתחת ללא גלילה.
          מובייל py-12, דסקטופ py-16. אם רוצים יותר אוויר — נוסיף mt למטה. */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14 lg:py-16 text-center">
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>שיעורי תורה חיים — לוח, שידור, ארכיון</span>
          </div>
        )}

        {/* === כותרת ראשית — Frank Ruhl Libre. גודל מצומצם לטובת אוויר */}
        <h1 className="font-display font-bold text-white leading-[1.05] tracking-tight text-3xl sm:text-5xl lg:text-6xl">
          שיעורי תורה בשידור חי.
          <br />
          <span className="text-amber-300">לוח, ארכיון, ושידור.</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          כל השיעורים החיים של רבני ישראל במקום אחד — חינם, וללא הרשמה.
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

        {/* === CTAs — מיקוד בשיעורים. רב מצטרף דרך /register, לא צריך CTA בולט בדף הבית === */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* Primary CTA — זהב */}
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-7 rounded-btn bg-amber-500 hover:bg-amber-400 text-slate-900 text-base font-bold shadow-card transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 w-full sm:w-auto"
          >
            {PrimaryIcon && <PrimaryIcon className="w-4 h-4 fill-current" />}
            <span>{primaryCta.label}</span>
            {primaryCta.arrowRight && <ChevronLeft className="w-4 h-4" />}
          </Link>
          {/* Secondary CTA — מתמקד במוצר עצמו: לוח השיעורים השבועי */}
          <a
            href="#calendar"
            className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-7 rounded-btn bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white text-base font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4" />
            לוח השיעורים השבועי
          </a>
        </div>
      </div>
    </section>
  );
}
