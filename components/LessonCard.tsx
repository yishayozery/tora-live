import Link from "next/link";
import Image from "next/image";
import type { MockLesson } from "@/lib/mock-data";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";
import { LogoIcon } from "@/components/Logo";

const fmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function LessonCard({ lesson }: { lesson: MockLesson & { posterUrl?: string | null } }) {
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="card group block overflow-hidden transition hover:border-primary/40"
    >
      {/* Poster / Logo fallback — תמיד יש משהו */}
      <div className="relative h-32 w-full overflow-hidden bg-paper-soft">
        {lesson.posterUrl ? (
          <Image
            src={lesson.posterUrl}
            alt={lesson.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
            <LogoIcon className="w-20 h-20 opacity-40" />
          </div>
        )}
        {lesson.isLive && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-live/95 px-2 py-1 text-[11px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            משדר עכשיו
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center gap-2 min-w-0 flex-wrap">
          <span className="pill">{lesson.category}</span>
          <BroadcastTypeBadge value={lesson.broadcastType} />
        </div>
        <h3 className="font-serif text-lg font-bold leading-snug text-ink group-hover:text-primary line-clamp-2">
          {lesson.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{lesson.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-ink-subtle">
          <span className="font-medium text-ink-soft">{lesson.rabbiName}</span>
          <span>{fmt.format(new Date(lesson.scheduledAt))}</span>
        </div>
      </div>
    </Link>
  );
}
