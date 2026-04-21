"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Eye, Share2, Clock, Flame } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { formatHebrewDate } from "@/lib/utils";

export type PopularLesson = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  viewCount: number;
  posterUrl: string | null;
  category: string | null;
  scheduledAt: string;
  durationMin: number | null;
};

export type TrendingTopic = { name: string; count: number };

export function PopularLessonsStrip({
  lessons,
  topics,
}: {
  lessons: PopularLesson[];
  topics: TrendingTopic[];
}) {
  if (lessons.length === 0 && topics.length === 0) return null;

  const shareText = (l: PopularLesson) =>
    encodeURIComponent(`שיעור מומלץ ב-TORA_LIVE:\n${l.title}\n${l.rabbiName}\nhttps://tora-live.co.il/lesson/${l.id}`);

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 scroll-mt-16 bg-gradient-to-b from-white via-paper-soft to-paper-warm">
      <div className="relative max-w-6xl mx-auto px-4">
        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Flame className="w-6 h-6 text-gold" />
            <h2 className="hebrew-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.15] tracking-tight">
              פופולריים החודש
            </h2>
            <Flame className="w-6 h-6 text-gold" />
          </div>
          <p className="text-base sm:text-lg text-ink-muted">השיעורים שצפו בהם הכי הרבה ב-30 הימים האחרונים</p>
        </div>

        {/* טרנדינג טופיקס — chips לחיצים */}
        {topics.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
              <TrendingUp className="w-4 h-4 text-primary" />
              טרנדינג השבוע:
            </span>
            {topics.map((t) => (
              <Link
                key={t.name}
                href={`/lessons?category=${encodeURIComponent(t.name)}`}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border border-border text-sm text-ink-soft hover:border-primary hover:text-primary hover:shadow-soft transition"
              >
                <span>#{t.name}</span>
                <span className="text-xs text-ink-muted">{t.count}</span>
              </Link>
            ))}
          </div>
        )}

        {/* שיעורים פופולריים — grid 4 עמודות */}
        {lessons.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {lessons.map((l, idx) => (
              <article
                key={l.id}
                className="group bg-white rounded-card border border-border overflow-hidden hover:shadow-card transition"
              >
                <Link href={`/lesson/${l.id}`} className="block relative aspect-video bg-paper-soft overflow-hidden">
                  {l.posterUrl ? (
                    <Image
                      src={l.posterUrl}
                      alt={l.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
                      <LogoIcon className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  {/* דירוג */}
                  {idx < 3 && (
                    <span className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold text-white text-xs font-bold shadow-soft">
                      {idx + 1}
                    </span>
                  )}
                </Link>
                <div className="p-3">
                  <Link href={`/lesson/${l.id}`} className="block">
                    <h3 className="font-bold text-sm text-ink line-clamp-2 mb-1 group-hover:text-primary transition">
                      {l.title}
                    </h3>
                  </Link>
                  {l.rabbiSlug ? (
                    <Link href={`/rabbi/${l.rabbiSlug}`} className="text-xs text-ink-muted hover:text-primary truncate block">
                      {l.rabbiName}
                    </Link>
                  ) : (
                    <p className="text-xs text-ink-muted truncate">{l.rabbiName}</p>
                  )}
                  {/* meta — view count + share */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-ink-muted">
                      <Eye className="w-3.5 h-3.5" />
                      {l.viewCount.toLocaleString("he-IL")}
                    </span>
                    <a
                      href={`https://wa.me/?text=${shareText(l)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium"
                      title="שלח לחבר ב-WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      שתף
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA להמשך */}
        <div className="text-center mt-8">
          <Link
            href="/lessons?sort=popular"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-btn bg-white border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition"
          >
            עוד שיעורים פופולריים ←
          </Link>
        </div>
      </div>
    </section>
  );
}
