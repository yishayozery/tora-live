import Link from "next/link";
import { Calendar, Radio } from "lucide-react";
import { formatHebrewDateLetters, formatHebrewTime } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  scheduledAt: Date | string;
  isLive: boolean;
}

interface Props {
  rabbiName: string;
  rabbiSlug: string;
  lessons: Lesson[];
}

/**
 * רצועת שיעורים קרובים של אותו רב. גלילה אופקית במובייל, grid בדסקטופ.
 */
export function RelatedLessons({ rabbiName, rabbiSlug, lessons }: Props) {
  if (!lessons.length) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-3 gap-3">
        <h2 className="hebrew-serif text-xl font-bold text-ink">
          עוד מהרב {rabbiName}
        </h2>
        <Link
          href={`/rabbi/${rabbiSlug}`}
          className="text-sm text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded shrink-0"
        >
          לכל השיעורים ←
        </Link>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:mx-0 sm:px-0">
        {lessons.map((l) => {
          const d = typeof l.scheduledAt === "string" ? new Date(l.scheduledAt) : l.scheduledAt;
          return (
            <li
              key={l.id}
              className="snap-start shrink-0 w-[80%] sm:w-auto"
            >
              <Link
                href={`/lesson/${l.id}`}
                className="block h-full rounded-card border border-border bg-white p-4 hover:border-primary/40 hover:shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                  {l.isLive ? (
                    <span className="inline-flex items-center gap-1 text-live font-semibold">
                      <Radio className="w-3 h-3" /> משדר
                    </span>
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  <span>{formatHebrewDateLetters(d, false)} · {formatHebrewTime(d)}</span>
                </div>
                <h3 className="font-bold text-ink line-clamp-2 leading-snug">{l.title}</h3>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
