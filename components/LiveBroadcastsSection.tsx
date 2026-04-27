"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Search, Users, Clock, ExternalLink, ChevronLeft, CalendarClock, Bell, LayoutGrid, List, BookOpen, Heart, Sparkles, Filter } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { pluralize, formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { LANGUAGES, BROADCAST_TYPES, languageLabel } from "@/lib/enums";
import { ReportLessonButton } from "@/components/ReportLessonButton";
import { detectEmbedPlatform, toEmbedUrl } from "@/lib/embeds";

export type LiveBroadcast = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  embedUrl?: string | null;
  externalUrl?: string | null;
  posterUrl?: string | null;
  liveStartedAt?: string | null;
  viewerCount?: number | null;
  category?: string | null;
  broadcastType?: string | null;
  language?: string | null;
};

export type NextBroadcast = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  scheduledAt: string;
  posterUrl?: string | null;
};

function isYouTubeEmbed(url?: string | null): boolean {
  return !!url && /youtube\.com\/embed\//.test(url);
}

/** מחזיר { embedUrl, platform } — תומך YouTube + Facebook. */
function resolveEmbed(b: LiveBroadcast): { embedUrl: string | null; platform: "youtube" | "facebook" | null } {
  // עדיפות 1 — embedUrl ישיר (כבר ב-iframe format)
  if (b.embedUrl) {
    if (isYouTubeEmbed(b.embedUrl)) return { embedUrl: b.embedUrl, platform: "youtube" };
    if (/facebook\.com\/plugins\/video/.test(b.embedUrl)) return { embedUrl: b.embedUrl, platform: "facebook" };
  }
  // עדיפות 2 — externalUrl → המרה
  const source = b.externalUrl || b.embedUrl;
  if (source) {
    const platform = detectEmbedPlatform(source);
    const url = toEmbedUrl(source);
    if (url && (platform === "youtube" || platform === "facebook")) {
      return { embedUrl: url, platform };
    }
  }
  return { embedUrl: null, platform: null };
}

function durationSince(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || ms > 24 * 3600_000) return null;
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return "החל זה עתה";
  if (totalMin < 60) return `${totalMin} דקות`;
  const hr = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${hr}:${String(min).padStart(2, "0")} שעות`;
}

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

export function LiveBroadcastsSection({ broadcasts, nextBroadcast }: { broadcasts: LiveBroadcast[]; nextBroadcast?: NextBroadcast | null }) {
  const [filter, setFilter] = useState("");
  const [rabbiFilter, setRabbiFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [durationFilter, setDurationFilter] = useState<"" | "short" | "mid" | "long">("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // tick every minute for "time since broadcast started"
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(i);
  }, []);

  // רשימות לפילטרים — מובנים מהשידורים הקיימים
  const rabbiOptions = useMemo(() => {
    const map = new Map<string, number>();
    broadcasts.forEach((b) => map.set(b.rabbiName, (map.get(b.rabbiName) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [broadcasts]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    broadcasts.forEach((b) => { if (b.category) map.set(b.category, (map.get(b.category) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [broadcasts]);

  const filtered = useMemo(() => {
    return broadcasts.filter((b) => {
      // חיפוש חופשי
      if (filter.trim()) {
        const q = filter.toLowerCase();
        const match = b.title.toLowerCase().includes(q) ||
          b.rabbiName.toLowerCase().includes(q) ||
          (b.category ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      // רב
      if (rabbiFilter && b.rabbiName !== rabbiFilter) return false;
      // קטגוריה
      if (categoryFilter && b.category !== categoryFilter) return false;
      // סוג שידור
      if (typeFilter && b.broadcastType !== typeFilter) return false;
      // שפה
      if (languageFilter && b.language !== languageFilter) return false;
      // משך השידור
      if (durationFilter) {
        const startedMs = b.liveStartedAt ? Date.now() - new Date(b.liveStartedAt).getTime() : 0;
        const minutes = Math.floor(startedMs / 60_000);
        if (durationFilter === "short" && minutes >= 10) return false;
        if (durationFilter === "mid" && (minutes < 10 || minutes > 60)) return false;
        if (durationFilter === "long" && minutes <= 60) return false;
      }
      return true;
    });
  }, [broadcasts, filter, rabbiFilter, categoryFilter, typeFilter, languageFilter, durationFilter]);

  const hasActiveFilter = !!(filter || rabbiFilter || categoryFilter || typeFilter || languageFilter || durationFilter);
  const clearAll = () => { setFilter(""); setRabbiFilter(""); setCategoryFilter(""); setTypeFilter(""); setLanguageFilter(""); setDurationFilter(""); };

  // רשימת שפות מתוך השידורים
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    broadcasts.forEach((b) => { if (b.language) set.add(b.language); });
    return Array.from(set);
  }, [broadcasts]);

  return (
    <section className="relative overflow-hidden py-3 sm:py-5 scroll-mt-16 min-h-[calc(100vh-100px)] flex flex-col">
      {/* רקע: תמונת בית מדרש/ספרייה — fixed — גוללים עליה */}
      <div
        className="absolute inset-0 pointer-events-none bg-fixed bg-center bg-cover"
        aria-hidden="true"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=75')",
        }}
      />
      {/* Overlay בהיר לקריאות — paper-warm semi-transparent */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper-warm/95 via-white/90 to-primary-soft/70 pointer-events-none" aria-hidden="true" />
      <div className="relative flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto px-4 flex-1 flex flex-col w-full">
        {/* === מסגרת חיצונית — ממלאה את הגובה === */}
        <div className="bg-white/75 backdrop-blur-md border-2 border-live/25 rounded-2xl shadow-card p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
        {/* === כותרת === */}
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
          </span>
          <h2 className="hebrew-serif text-lg sm:text-2xl lg:text-3xl font-bold text-ink leading-none">שידורים חיים עכשיו</h2>
          {broadcasts.length > 0 && (
            <span className="text-sm text-ink-muted">
              · {broadcasts.length}
            </span>
          )}
        </div>

        {/* === סרגל פילטרים בשורה אחת — מתקפל למתקדם === */}
        {broadcasts.length > 0 && (
          <div className="max-w-5xl mx-auto mb-2 sm:mb-3 bg-white border-2 border-live/40 rounded-card shadow-card">
            {/* שורה אחת: אייקון + חיפוש + chips + count + מתקדם + תצוגה */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 flex-wrap">
              <Filter className="w-4 h-4 text-live shrink-0" aria-hidden="true" />

              {/* חיפוש */}
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="חיפוש..."
                  className="w-full h-8 pr-8 pl-2 rounded-btn border border-border bg-paper-soft text-sm focus:border-primary focus:bg-white focus:outline-none"
                />
              </div>

              {/* Chips סוג שידור */}
              <div className="flex gap-1">
                {BROADCAST_TYPES.map((t) => {
                  const active = typeFilter === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTypeFilter(active ? "" : t.value)}
                      className={`h-8 px-2.5 rounded-full text-xs font-medium border transition ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"
                      }`}
                      aria-pressed={active}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Count */}
              <span className="text-xs font-semibold text-live bg-live/10 border border-live/20 rounded-full px-2 py-0.5">
                {filtered.length}/{broadcasts.length}
              </span>

              <div className="mr-auto flex items-center gap-1.5">
                {/* מתקדם */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className={`h-8 px-2.5 rounded-btn text-xs font-medium border transition inline-flex items-center gap-1 ${
                    showAdvanced || hasActiveFilter ? "bg-primary-soft text-primary border-primary/30" : "bg-white border-border text-ink-soft hover:text-ink"
                  }`}
                  aria-expanded={showAdvanced}
                >
                  מתקדם {showAdvanced ? "▴" : "▾"}
                </button>

                {hasActiveFilter && (
                  <button type="button" onClick={clearAll}
                    className="h-8 px-2 rounded-btn text-xs text-primary hover:underline font-medium">
                    נקה
                  </button>
                )}

                {/* Toggle תצוגה */}
                <div className="flex gap-0.5 p-0.5 bg-paper-soft rounded-btn border border-border" role="group" aria-label="תצוגה">
                  <button type="button" onClick={() => setView("grid")}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-btn transition ${view === "grid" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"}`}
                    aria-label="רשת" aria-pressed={view === "grid"}><LayoutGrid className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setView("list")}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-btn transition ${view === "list" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"}`}
                    aria-label="רשימה" aria-pressed={view === "list"}><List className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* פילטרים מתקדמים — נפתחים בלחיצה */}
            {showAdvanced && (
              <div className="border-t border-border px-2.5 sm:px-3 py-2 flex items-center gap-2 flex-wrap bg-paper-soft/50">
                <select value={rabbiFilter} onChange={(e) => setRabbiFilter(e.target.value)}
                  className={`h-8 px-2 rounded-btn border text-xs bg-white transition ${rabbiFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                  aria-label="רב">
                  <option value="">רב · כולם</option>
                  {rabbiOptions.map(([name, count]) => (
                    <option key={name} value={name}>{name} ({count})</option>
                  ))}
                </select>

                {categoryOptions.length > 0 && (
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`h-8 px-2 rounded-btn border text-xs bg-white transition ${categoryFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                    aria-label="נושא">
                    <option value="">נושא · הכל</option>
                    {categoryOptions.map(([cat, count]) => (
                      <option key={cat} value={cat}>{cat} ({count})</option>
                    ))}
                  </select>
                )}

                {availableLanguages.length > 1 && (
                  <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
                    className={`h-8 px-2 rounded-btn border text-xs bg-white transition ${languageFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                    aria-label="שפה">
                    <option value="">שפה · הכל</option>
                    {availableLanguages.map((code) => (
                      <option key={code} value={code}>{languageLabel(code) || code}</option>
                    ))}
                  </select>
                )}

                <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value as any)}
                  className={`h-8 px-2 rounded-btn border text-xs bg-white transition ${durationFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"}`}
                  aria-label="משך">
                  <option value="">משך · הכל</option>
                  <option value="short">התחיל עכשיו</option>
                  <option value="mid">באמצע</option>
                  <option value="long">זמן רב</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* === Empty state === */}
        {broadcasts.length === 0 ? (
          nextBroadcast ? (
            <Link
              href={`/lesson/${nextBroadcast.id}`}
              className="block max-w-2xl mx-auto rounded-card border border-primary/20 bg-gradient-to-br from-primary-soft via-white to-paper-soft p-6 hover:border-primary/40 hover:shadow-soft transition group"
            >
              <div className="flex items-start gap-4 flex-col sm:flex-row">
                <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarClock className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">השיעור החי הבא</div>
                  <h3 className="hebrew-serif text-xl font-bold text-ink group-hover:text-primary transition">{nextBroadcast.title}</h3>
                  <div className="text-sm text-ink-soft mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{nextBroadcast.rabbiName}</span>
                    <span className="text-ink-muted">·</span>
                    <span>{formatHebrewDate(nextBroadcast.scheduledAt)} ב-{formatHebrewTime(nextBroadcast.scheduledAt)}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-primary font-bold">{relativeFuture(nextBroadcast.scheduledAt)}</span>
                  </div>
                </div>
                <div className="hidden sm:flex shrink-0 self-center">
                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-white border border-border text-ink-soft text-sm font-medium group-hover:border-primary group-hover:text-primary">
                    <Bell className="w-3.5 h-3.5" />
                    הוסף ללוח שלי
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="max-w-2xl mx-auto rounded-card border border-dashed border-border bg-white p-8 text-center">
              <Radio className="w-8 h-8 text-ink-muted mx-auto mb-2" />
              <p className="text-ink-muted">אין כרגע שיעורים בשידור חי. תחזור מאוחר יותר.</p>
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-border p-6 text-center text-sm text-ink-muted max-w-xl mx-auto">
            אין שידור חי התואם לסינון שבחרת.{" "}
            <button onClick={clearAll} className="text-primary hover:underline">נקה סינון</button>
          </div>
        ) : view === "grid" ? (
          // הקוביות שומרות על יחס 16:9. הגריד ממורכז אנכית באזור האפור.
          <div className="flex-1 flex items-center justify-center w-full py-2">
            <div className={`w-full grid gap-3 sm:gap-4 ${
              filtered.length === 1
                ? "grid-cols-1 max-w-2xl mx-auto"
                : filtered.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto"
                  : filtered.length === 3
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : filtered.length === 4
                      ? "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {filtered.map((b) => <LiveCardGrid key={b.id} b={b} />)}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3 flex-1 w-full">
            {filtered.map((b) => <LiveCardList key={b.id} b={b} />)}
          </div>
        )}
        </div> {/* סגירת מסגרת חיצונית */}
      </div>
      </div>
    </section>
  );
}

/* ============= GRID VIEW ============= */
function LiveCardGrid({ b }: { b: LiveBroadcast }) {
  const { embedUrl, platform } = resolveEmbed(b);
  const dur = durationSince(b.liveStartedAt);
  const lessonHref = `/lesson/${b.id}`;

  return (
    <article className="rounded-card border border-live/30 bg-white shadow-card overflow-hidden group hover:shadow-soft transition">
      <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
        {embedUrl && platform === "youtube" ? (
          <iframe
            src={`${embedUrl}?autoplay=0&mute=1&controls=1&modestbranding=1`}
            title={b.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        ) : embedUrl && platform === "facebook" ? (
          <iframe
            src={embedUrl}
            title={b.title}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            scrolling="no"
          />
        ) : b.externalUrl ? (
          <a href={b.externalUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-live/80 to-primary/70 text-white">
            <div className="text-center">
              <ExternalLink className="w-8 h-8 mx-auto mb-1" />
              <span className="text-sm font-bold">פתח שידור</span>
            </div>
          </a>
        ) : (
          <Link href={lessonHref} className="absolute inset-0 bg-gradient-to-br from-paper-soft to-paper-warm flex items-center justify-center">
            <LogoIcon className="w-16 h-16 opacity-40" />
          </Link>
        )}
        {/* LIVE badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-live text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          LIVE
        </div>
        {b.viewerCount != null && b.viewerCount > 0 && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
            <Users className="w-3 h-3" />
            {b.viewerCount.toLocaleString("he-IL")}
          </div>
        )}
        {/* משך השידור — בולט בתחתית */}
        {dur && (
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/75 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
            <Clock className="w-3 h-3" />
            משודר {dur}
          </div>
        )}
      </div>

      <div className="p-3">
        <Link href={lessonHref} className="block">
          <h3 className="font-bold text-ink line-clamp-1 group-hover:text-primary transition">{b.title}</h3>
          <div className="text-xs text-ink-muted mt-1">
            {b.rabbiSlug ? (
              <Link href={`/rabbi/${b.rabbiSlug}`} className="hover:text-primary">{b.rabbiName}</Link>
            ) : <span>{b.rabbiName}</span>}
          </div>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={lessonHref}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-btn bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition"
          >
            <Radio className="w-3 h-3" />
            לדף השיעור
            <ChevronLeft className="w-3 h-3" />
          </Link>
          <ReportLessonButton lessonId={b.id} />
        </div>
      </div>
    </article>
  );
}

/* ============= LIST VIEW ============= */
function LiveCardList({ b }: { b: LiveBroadcast }) {
  const youtube = isYouTubeEmbed(b.embedUrl) ? b.embedUrl : null;
  const dur = durationSince(b.liveStartedAt);
  const lessonHref = `/lesson/${b.id}`;

  return (
    <article className="flex items-center gap-4 rounded-card border border-live/30 bg-white shadow-card hover:shadow-soft transition p-3">
      {/* Thumbnail */}
      <div className="relative w-32 h-20 sm:w-44 sm:h-28 shrink-0 bg-black rounded-btn overflow-hidden">
        {youtube ? (
          <iframe
            src={`${youtube}?autoplay=0&mute=1&controls=0&modestbranding=1`}
            title={b.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute inset-0 w-full h-full pointer-events-none"
            loading="lazy"
          />
        ) : b.posterUrl ? (
          <Image src={b.posterUrl} alt={b.title} fill sizes="176px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-paper-soft to-paper-warm flex items-center justify-center">
            <LogoIcon className="w-10 h-10 opacity-40" />
          </div>
        )}
        <div className="absolute top-1 right-1 flex items-center gap-1 bg-live text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          <span className="relative flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-white" />
          </span>
          LIVE
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={lessonHref}>
          <h3 className="font-bold text-ink line-clamp-1 hover:text-primary transition">{b.title}</h3>
        </Link>
        <div className="text-sm text-ink-soft mt-1 flex items-center gap-3 flex-wrap">
          {b.rabbiSlug ? (
            <Link href={`/rabbi/${b.rabbiSlug}`} className="hover:text-primary">{b.rabbiName}</Link>
          ) : <span>{b.rabbiName}</span>}
          {dur && (
            <span className="inline-flex items-center gap-1 text-live font-semibold">
              <Clock className="w-3.5 h-3.5" />
              משודר {dur}
            </span>
          )}
          {b.viewerCount != null && b.viewerCount > 0 && (
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Users className="w-3.5 h-3.5" />
              {b.viewerCount.toLocaleString("he-IL")}
            </span>
          )}
        </div>
      </div>

      {/* CTA + Report */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <Link
          href={lessonHref}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
        >
          <Radio className="w-4 h-4" />
          <span className="hidden sm:inline">לצפייה</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <ReportLessonButton lessonId={b.id} />
      </div>
    </article>
  );
}
