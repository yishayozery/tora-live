"use client";

// HomeStudyAndVoices — סקציה מאוחדת לדף הבית:
//   חצי עליון — "מה לומדים השבוע" (פופולריים + טרנדינג טופיקס)
//   חצי תחתון — "מה אומרים תלמידים" (testimonials)
// המטרה: לצמצם 2 סקציות נפרדות לסקציה אחת רגועה.

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Eye, Share2, Flame, Quote } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import type { PopularLesson, TrendingTopic } from "@/components/PopularLessonsStrip";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "סוף סוף יש מקום אחד לכל השיעורים שלי. התלמידים שלי מוצאים אותי בקלות, ואני שולט על התוכן.",
    author: "הרב דוד כהן",
    role: "ראש ישיבה",
  },
  {
    quote: "אני עוקב אחרי 8 רבנים דרך האתר ומקבל התראה לכל שיעור חדש. חוסך לי שעות חיפוש ביוטיוב.",
    author: "יוסף ל.",
    role: "תלמיד, ירושלים",
  },
  {
    quote: "הפלטפורמה הראשונה שמבינה את הקהל הדתי-לאומי — בלי פרסומות, בלי הפרעות, רק תורה.",
    author: "הרב אליהו בן חיים",
    role: "רב קהילה",
  },
];

export function HomeStudyAndVoices({
  lessons,
  topics,
}: {
  lessons: PopularLesson[];
  topics: TrendingTopic[];
}) {
  const showStudy = lessons.length > 0 || topics.length > 0;

  const shareText = (l: PopularLesson) =>
    encodeURIComponent(`שיעור מומלץ ב-TORA_LIVE:\n${l.title}\n${l.rabbiName}\nhttps://tora-live.co.il/lesson/${l.id}`);

  return (
    <section className="relative py-12 sm:py-16 bg-paper-soft scroll-mt-16" aria-label="מה לומדים השבוע ומה אומרים תלמידים">
      <div className="relative max-w-6xl mx-auto px-4">
        {/* === חלק עליון: מה לומדים השבוע === */}
        {showStudy && (
          <div className="mb-14 sm:mb-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-3">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-gold" aria-hidden="true" />
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight">
                  מה לומדים השבוע
                </h2>
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-gold" aria-hidden="true" />
              </div>
              <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
                השיעורים שצפו בהם הכי הרבה ב-30 הימים האחרונים
              </p>
            </div>

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
                      {idx < 3 && (
                        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold text-white text-xs font-bold shadow-soft">
                          {idx + 1}
                        </span>
                      )}
                    </Link>
                    <div className="p-3">
                      <Link href={`/lesson/${l.id}`} className="block">
                        <h3 className="font-bold text-sm text-ink line-clamp-2 mb-1 group-hover:text-primary transition leading-snug">
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

            <div className="text-center mt-8">
              <Link
                href="/lessons?sort=popular"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-btn bg-white border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition"
              >
                עוד שיעורים פופולריים ←
              </Link>
            </div>
          </div>
        )}

        {/* === מפריד שקט בין שני החלקים === */}
        {showStudy && (
          <div className="flex items-center justify-center gap-3 mb-10" aria-hidden="true">
            <span className="h-px w-16 bg-border" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
            <span className="h-px w-16 bg-border" />
          </div>
        )}

        {/* === חלק תחתון: מה אומרים תלמידים === */}
        <div>
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight">
              מה אומרים תלמידים
            </h2>
            <p className="text-base sm:text-lg text-ink-soft mt-3 max-w-2xl mx-auto leading-relaxed">
              רבנים ותלמידים שבחרו ב-TORA_LIVE
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="relative rounded-card border border-border bg-white p-5 hover:shadow-soft transition"
              >
                <Quote className="absolute top-3 right-3 w-6 h-6 text-gold/40 rotate-180" aria-hidden="true" />
                <blockquote className="text-sm sm:text-base text-ink leading-relaxed mb-4 relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-border pt-3">
                  <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-display font-bold text-lg shrink-0">
                    {t.author.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-ink text-sm truncate">{t.author}</div>
                    <div className="text-xs text-ink-muted truncate">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
