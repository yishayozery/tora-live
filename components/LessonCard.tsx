import Link from "next/link";
import type { MockLesson } from "@/lib/mock-data";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";

const fmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function LessonCard({ lesson }: { lesson: MockLesson }) {
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="card group block p-5 transition hover:border-primary/40"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="pill">{lesson.category}</span>
          <BroadcastTypeBadge value={lesson.broadcastType} />
        </div>
        {lesson.isLive && (
          <span className="pill-live">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
            משדר עכשיו
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-bold leading-snug text-ink group-hover:text-primary">
        {lesson.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{lesson.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-subtle">
        <span>{lesson.rabbiName}</span>
        <span>{fmt.format(new Date(lesson.scheduledAt))}</span>
      </div>
    </Link>
  );
}
