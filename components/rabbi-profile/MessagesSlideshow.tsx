"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { nextSlideIndex, prevSlideIndex } from "@/lib/rabbi-message";
import { formatHebrewDate } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  createdAt: string | Date;
};

const ROTATE_MS = 8000;

export function MessagesSlideshow({
  messages,
  rabbiName,
}: {
  messages: Message[];
  rabbiName: string;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = messages.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    intervalRef.current = setInterval(() => {
      setIdx((i) => nextSlideIndex(i, total));
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, total]);

  if (total === 0) return null;

  // Clamp idx within range (defensive)
  const safeIdx = ((idx % total) + total) % total;
  const m = messages[safeIdx];

  return (
    <section
      className="mb-8"
      aria-label={`הודעות מהרב ${rabbiName}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative rounded-card border border-gold/30 bg-gradient-to-bl from-gold-soft/60 via-paper-warm to-white p-5 sm:p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <Quote className="w-6 h-6 text-gold shrink-0 mt-1" aria-hidden />
          <div className="flex-1 min-w-0">
            <div
              key={m.id}
              className="text-ink hebrew-serif text-lg sm:text-xl leading-relaxed whitespace-pre-line break-words"
            >
              {m.content}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-ink-muted">
                {formatHebrewDate(new Date(m.createdAt))}
              </span>
              {total > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIdx((i) => prevSlideIndex(i, total))}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-white text-ink-soft hover:border-primary hover:text-primary transition"
                    aria-label="ההודעה הקודמת"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 px-1" role="tablist">
                    {messages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === safeIdx}
                        aria-label={`הודעה ${i + 1} מתוך ${total}`}
                        onClick={() => setIdx(i)}
                        className={
                          "w-2 h-2 rounded-full transition " +
                          (i === safeIdx
                            ? "bg-gold w-4"
                            : "bg-border hover:bg-ink-muted")
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIdx((i) => nextSlideIndex(i, total))}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-white text-ink-soft hover:border-primary hover:text-primary transition"
                    aria-label="ההודעה הבאה"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
