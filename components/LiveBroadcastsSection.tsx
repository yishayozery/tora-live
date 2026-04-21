"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Search, Users, Clock, ExternalLink, ChevronLeft, CalendarClock, Bell } from "lucide-react";
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

function relativePast(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || ms > 24 * 3600_000) return null;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "החל זה עתה";
  if (min < 60) return `החל לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  return `החל לפני ${hr}:${String(min % 60).padStart(2, "0")} שע׳`;
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

  const filtered = useMemo(() => {
    if (!filter.trim()) return broadcasts;
    const q = filter.toLowerCase();
    return broadcasts.filter((b) =>
      b.title.toLowerCase().includes(q) ||
      b.rabbiName.toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q)
    );
  }, [broadcasts, filter]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-live" />
          </span>
          <h2 className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink">שידורים חיים עכשיו</h2>
          <span className="text-sm text-ink-muted">
            {broadcasts.length === 0 ? "אין כרגע" : pluralize(broadcasts.length, "שידור חי", "שידורים חיים")}
          </span>
        </div>
        {broadcasts.length > 3 && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="חיפוש בשידורים חיים..."
              className="w-full h-10 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Empty state — show next */}
      {broadcasts.length === 0 ? (
        nextBroadcast ? (
          <Link
            href={`/lesson/${nextBroadcast.id}`}
            className="block rounded-card border border-primary/20 bg-gradient-to-br from-primary-soft via-white to-paper-soft p-6 hover:border-primary/40 hover:shadow-soft transition group"
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
          <div className="rounded-card border border-dashed border-border bg-white p-8 text-center">
            <Radio className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            <p className="text-ink-muted">אין כרגע שיעורים בשידור חי. תחזור מאוחר יותר.</p>
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => <LiveCard key={b.id} b={b} />)}
        </div>
      )}

      {filter && filtered.length === 0 && (
        <div className="rounded-card border border-dashed border-border p-6 text-center text-sm text-ink-muted mt-3">
          אין שידור חי תחת הסינון &quot;{filter}&quot;.{" "}
          <button onClick={() => setFilter("")} className="text-primary hover:underline">הצג הכל</button>
        </div>
      )}
    </section>
  );
}

function LiveCard({ b }: { b: LiveBroadcast }) {
  const youtube = isYouTubeEmbed(b.embedUrl) ? b.embedUrl : null;
  const startedAgo = relativePast(b.liveStartedAt);
  const lessonHref = `/lesson/${b.id}`;

  return (
    <article className="rounded-card border border-live/30 bg-white shadow-card overflow-hidden group hover:shadow-soft transition">
      {/* Player area — small embed */}
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
            {b.posterUrl ? (
              <Image src={b.posterUrl} alt={b.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover opacity-50" />
            ) : null}
            <div className="relative z-10 text-center">
              <ExternalLink className="w-8 h-8 mx-auto mb-1" />
              <span className="text-sm font-bold">פתח שידור</span>
            </div>
          </a>
        ) : (
          <Link href={lessonHref} className="absolute inset-0 bg-gradient-to-br from-paper-soft to-paper-warm flex items-center justify-center">
            <LogoIcon className="w-16 h-16 opacity-40" />
          </Link>
        )}
        {/* LIVE badge overlay */}
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
      </div>

      {/* Info */}
      <div className="p-3">
        <Link href={lessonHref} className="block">
          <h3 className="font-bold text-ink line-clamp-1 group-hover:text-primary transition">{b.title}</h3>
          <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
            {b.rabbiSlug ? (
              <Link href={`/rabbi/${b.rabbiSlug}`} className="hover:text-primary">{b.rabbiName}</Link>
            ) : <span>{b.rabbiName}</span>}
            {startedAgo && (
              <>
                <span className="text-ink-muted">·</span>
                <span className="text-live font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {startedAgo}
                </span>
              </>
            )}
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
