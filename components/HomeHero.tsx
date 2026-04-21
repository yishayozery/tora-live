"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Play, ArrowLeft, Sparkles, Clock, Calendar as CalIcon, Bell } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { formatHebrewDateFull } from "@/lib/hebrew-dates";

export type HeroLesson = {
  id: string;
  title: string;
  description?: string;
  rabbiName: string;
  rabbiSlug: string;
  scheduledAt: string;
  durationMin?: number | null;
  posterUrl?: string | null;
  embedUrl?: string | null;
  externalUrl?: string | null;
  category?: string | null;
};

type Props = {
  /** השיעור שמשדר עכשיו (אם יש) */
  liveLesson?: HeroLesson | null;
  /** השיעור הבא המתוכנן (אם אין live) */
  nextLesson?: HeroLesson | null;
  /** השיעור המומלץ של היום (אם אין live ואין next קרוב) */
  recommendedLesson?: HeroLesson | null;
};

function relativeFuture(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "כעת";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `בעוד ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `בעוד ${hr} ${hr === 1 ? "שעה" : "שעות"}`;
  const days = Math.floor(hr / 24);
  if (days === 1) return "מחר";
  return `בעוד ${days} ימים`;
}

export function HomeHero({ liveLesson, nextLesson, recommendedLesson }: Props) {
  // עדיפות: live → next → recommended → fallback
  const lesson = liveLesson ?? nextLesson ?? recommendedLesson;
  const mode: "live" | "next" | "recommended" | "empty" =
    liveLesson ? "live" : nextLesson ? "next" : recommendedLesson ? "recommended" : "empty";

  // עדכון "בעוד X דק׳" כל דקה
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  const today = new Date();

  if (!lesson) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary via-primary-hover to-ink/90 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <LogoIcon className="w-20 h-20 mx-auto mb-6 opacity-90" />
          <h1 className="hebrew-serif text-4xl sm:text-6xl font-bold leading-tight">
            הבית הדיגיטלי של רבני ישראל
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">
            שיעורי תורה חיים ומוקלטים מרבנים מובילים — חינם, בלי הרשמה
          </p>
          <Link
            href="/lessons"
            className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-btn bg-white text-primary font-bold shadow-soft hover:bg-paper-soft transition"
          >
            גלו שיעורים
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    );
  }

  const lessonHref = `/lesson/${lesson.id}`;
  const isLive = mode === "live";

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-ink via-ink/95 to-primary/40 text-white">
      {/* Background image with overlay */}
      {lesson.posterUrl && (
        <div className="absolute inset-0 opacity-25">
          <Image
            src={lesson.posterUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-sm"
            priority
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-tl from-ink via-ink/80 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Top: Hebrew date + status */}
        <div className="flex items-center justify-between mb-6 text-xs sm:text-sm flex-wrap gap-2">
          <div className="text-white/70 flex items-center gap-2">
            <CalIcon className="w-3.5 h-3.5" />
            {formatHebrewDateFull(today)}
          </div>
          {isLive && (
            <div className="inline-flex items-center gap-2 bg-live px-3 py-1 rounded-full text-xs font-bold shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              משדרים עכשיו
            </div>
          )}
          {mode === "next" && (
            <div className="inline-flex items-center gap-2 bg-primary px-3 py-1 rounded-full text-xs font-bold">
              <Clock className="w-3 h-3" />
              {relativeFuture(lesson.scheduledAt)}
            </div>
          )}
          {mode === "recommended" && (
            <div className="inline-flex items-center gap-2 bg-gold/90 text-ink px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              מומלץ היום
            </div>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Left: Text + CTA */}
          <div className="lg:col-span-3 space-y-5">
            {lesson.category && (
              <div className="inline-block text-xs font-semibold text-gold bg-gold/15 px-3 py-1 rounded-full">
                {lesson.category}
              </div>
            )}
            <h1 className="hebrew-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-4 text-white/85 flex-wrap">
              <Link href={lesson.rabbiSlug ? `/rabbi/${lesson.rabbiSlug}` : "#"} className="text-lg font-medium hover:text-gold transition">
                {lesson.rabbiName}
              </Link>
              <span className="text-white/40">·</span>
              <span className="text-sm">
                {isLive
                  ? "בשידור חי כעת"
                  : `${formatHebrewDate(lesson.scheduledAt)} ב-${formatHebrewTime(lesson.scheduledAt)}`}
              </span>
              {lesson.durationMin && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lesson.durationMin >= 60
                      ? `${Math.floor(lesson.durationMin / 60)}:${String(lesson.durationMin % 60).padStart(2, "0")} שע׳`
                      : `${lesson.durationMin} דק׳`}
                  </span>
                </>
              )}
            </div>

            {lesson.description && (
              <p className="text-white/80 text-base sm:text-lg leading-relaxed line-clamp-2 max-w-2xl">
                {lesson.description}
              </p>
            )}

            {/* CTAs — single primary, secondary subtle */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={lessonHref}
                className="inline-flex items-center gap-2 h-13 px-7 rounded-btn bg-gold text-ink font-bold text-lg shadow-soft hover:bg-gold/90 hover:scale-[1.02] transition"
              >
                {isLive ? <Radio className="w-5 h-5" /> : <Play className="w-5 h-5 fill-ink" />}
                {isLive ? "צפו בשידור" : mode === "next" ? "פרטים נוספים" : "צפו בשיעור"}
              </Link>
              {!isLive && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-13 px-5 rounded-btn bg-white/10 backdrop-blur border border-white/20 text-white font-medium hover:bg-white/20 transition"
                >
                  <Bell className="w-4 h-4" />
                  הוסף ללוח שלי
                </button>
              )}
            </div>
          </div>

          {/* Right: Visual / poster */}
          <div className="lg:col-span-2 hidden lg:block">
            <Link href={lessonHref} className="block relative aspect-video rounded-card overflow-hidden shadow-card hover:shadow-soft transition group">
              {lesson.posterUrl ? (
                <Image
                  src={lesson.posterUrl}
                  alt={lesson.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-paper-soft to-paper-warm flex items-center justify-center">
                  <LogoIcon className="w-32 h-32 opacity-50" />
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition">
                <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-card group-hover:scale-110 transition">
                  {isLive ? <Radio className="w-9 h-9 text-live" /> : <Play className="w-9 h-9 text-primary fill-primary translate-x-0.5" />}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
