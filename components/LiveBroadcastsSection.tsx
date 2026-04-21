"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Search, Users, Clock, ExternalLink, ChevronLeft, CalendarClock, Bell, LayoutGrid, List } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { pluralize, formatHebrewDate, formatHebrewTime } from "@/lib/utils";

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
  const [durationFilter, setDurationFilter] = useState<"" | "short" | "mid" | "long">("");
  const [view, setView] = useState<"grid" | "list">("grid");

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
  }, [broadcasts, filter, rabbiFilter, categoryFilter, durationFilter]);

  const hasActiveFilter = !!(filter || rabbiFilter || categoryFilter || durationFilter);
  const clearAll = () => { setFilter(""); setRabbiFilter(""); setCategoryFilter(""); setDurationFilter(""); };

  return (
    <section className="relative overflow-hidden py-14 sm:py-20 scroll-mt-16">
      {/* רקע 1: gradient כהה עם דוגמת גלים עדינה — אווירת "אולפן שידור" */}
      <div className="absolute inset-0 bg-gradient-to-bl from-ink via-ink/95 to-primary/80 pointer-events-none" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 25% 20%, white 1px, transparent 1px), radial-gradient(circle at 75% 60%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 90px 90px",
        }}
      />
      <div className="relative text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* === כותרת ממורכזת === */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-live" />
            </span>
            <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-white drop-shadow">שידורים חיים עכשיו</h2>
          </div>
          <p className="text-sm text-white/75">
            {broadcasts.length === 0 ? "אין כרגע שידורים חיים" : pluralize(broadcasts.length, "שידור חי", "שידורים חיים")}
          </p>
        </div>

        {/* === חיפוש + פילטרים מובנים + toggle תצוגה === */}
        {broadcasts.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6 space-y-2">
            {/* שורה 1: חיפוש חופשי + toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="חיפוש חופשי — רב, נושא או כותרת..."
                  className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none shadow-soft"
                />
              </div>
              <div className="flex gap-1 p-1 bg-white rounded-btn border border-border shadow-soft" role="group" aria-label="תצוגה">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-btn transition ${
                    view === "grid" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                  }`}
                  aria-label="תצוגת רשת"
                  aria-pressed={view === "grid"}
                  title="תצוגת רשת"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-btn transition ${
                    view === "list" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
                  }`}
                  aria-label="תצוגת רשימה"
                  aria-pressed={view === "list"}
                  title="תצוגת רשימה"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* שורה 2: פילטרים מובנים — מסננים מיד בשינוי */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={rabbiFilter}
                onChange={(e) => setRabbiFilter(e.target.value)}
                className={`h-10 px-3 rounded-btn border text-sm bg-white transition ${
                  rabbiFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"
                }`}
                aria-label="פילטר לפי רב"
              >
                <option value="">כל הרבנים ({broadcasts.length})</option>
                {rabbiOptions.map(([name, count]) => (
                  <option key={name} value={name}>{name} ({count})</option>
                ))}
              </select>

              {categoryOptions.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`h-10 px-3 rounded-btn border text-sm bg-white transition ${
                    categoryFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"
                  }`}
                  aria-label="פילטר לפי נושא"
                >
                  <option value="">כל הנושאים</option>
                  {categoryOptions.map(([cat, count]) => (
                    <option key={cat} value={cat}>{cat} ({count})</option>
                  ))}
                </select>
              )}

              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as any)}
                className={`h-10 px-3 rounded-btn border text-sm bg-white transition ${
                  durationFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"
                }`}
                aria-label="פילטר לפי משך השידור"
              >
                <option value="">כל משכי השידור</option>
                <option value="short">התחילו עכשיו (&lt; 10 דק׳)</option>
                <option value="mid">באמצע השיעור (10–60 דק׳)</option>
                <option value="long">בשידור זמן ארוך (&gt; 60 דק׳)</option>
              </select>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-10 px-4 rounded-btn text-sm text-primary hover:underline font-medium"
                >
                  נקה סינון
                </button>
              )}

              <div className="mx-auto sm:mr-auto sm:ml-0 text-xs text-white/70 self-center">
                מציג {filtered.length} מתוך {broadcasts.length}
              </div>
            </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => <LiveCardGrid key={b.id} b={b} />)}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {filtered.map((b) => <LiveCardList key={b.id} b={b} />)}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}

/* ============= GRID VIEW ============= */
function LiveCardGrid({ b }: { b: LiveBroadcast }) {
  const youtube = isYouTubeEmbed(b.embedUrl) ? b.embedUrl : null;
  const dur = durationSince(b.liveStartedAt);
  const lessonHref = `/lesson/${b.id}`;

  return (
    <article className="rounded-card border border-live/30 bg-white shadow-card overflow-hidden group hover:shadow-soft transition">
      <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
        {youtube ? (
          <iframe
            src={`${youtube}?autoplay=0&mute=1&controls=1&modestbranding=1`}
            title={b.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
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
        <Link
          href={lessonHref}
          className="mt-3 inline-flex items-center gap-1 h-8 px-3 rounded-btn bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition"
        >
          <Radio className="w-3 h-3" />
          לדף השיעור
          <ChevronLeft className="w-3 h-3" />
        </Link>
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

      {/* CTA */}
      <div className="shrink-0">
        <Link
          href={lessonHref}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
        >
          <Radio className="w-4 h-4" />
          <span className="hidden sm:inline">לצפייה</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
