"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Play, ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

const STORAGE_KEY = "tora-live:now-playing";

type NowPlaying = {
  id: string;
  title: string;
  rabbiName: string;
  posterUrl?: string | null;
  startedAt: number;
};

/**
 * Persistent mini-player at the bottom.
 * Shows when user has navigated away from a lesson page they were on.
 *
 * Storage in localStorage: lesson clicked → tracked.
 * If user is on the same lesson page → not shown.
 * If user navigated elsewhere → floating bar with "back to lesson" + dismiss.
 */
export function PersistentPlayer() {
  const pathname = usePathname();
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as NowPlaying;
      // Auto-expire after 4 hours
      if (Date.now() - data.startedAt > 4 * 3600_000) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setNowPlaying(data);
    } catch {}

    // Listen for "lesson-played" events from other parts of the app
    function onPlay(e: Event) {
      const detail = (e as CustomEvent<NowPlaying>).detail;
      if (detail) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
        setNowPlaying(detail);
      }
    }
    window.addEventListener("lesson-played", onPlay as EventListener);
    return () => window.removeEventListener("lesson-played", onPlay as EventListener);
  }, []);

  function dismiss() {
    localStorage.removeItem(STORAGE_KEY);
    setNowPlaying(null);
  }

  // Hide if no playing OR if currently on the lesson's own page
  if (!nowPlaying) return null;
  if (pathname === `/lesson/${nowPlaying.id}`) return null;

  const minutesAgo = Math.floor((Date.now() - nowPlaying.startedAt) / 60_000);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-3 sm:px-5 pb-3 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <Link
          href={`/lesson/${nowPlaying.id}`}
          className="flex items-center gap-3 bg-ink/95 backdrop-blur text-white rounded-card shadow-card px-3 py-2.5 hover:bg-ink transition group border border-white/10"
        >
          <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-paper-soft">
            {nowPlaying.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nowPlaying.posterUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
                <LogoIcon className="w-7 h-7 opacity-60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/70">השיעור הפעיל שלך</div>
            <div className="font-semibold truncate">{nowPlaying.title}</div>
            <div className="text-xs text-white/60 truncate">{nowPlaying.rabbiName} · התחלת לפני {minutesAgo} דק׳</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-primary text-white text-sm font-medium group-hover:bg-primary-hover transition">
              <Play className="w-3.5 h-3.5 fill-white" />
              חזור לשיעור
            </span>
            <span className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-btn bg-primary group-hover:bg-primary-hover transition">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-btn text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** קוראים לזה מ-LessonPage כשמשתמש לוחץ play */
export function trackLessonPlay(input: NowPlaying) {
  if (typeof window === "undefined") return;
  const detail = { ...input, startedAt: Date.now() };
  window.dispatchEvent(new CustomEvent("lesson-played", { detail }));
}
