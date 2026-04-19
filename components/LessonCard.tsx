import Link from "next/link";
import Image from "next/image";
import type { MockLesson } from "@/lib/mock-data";
import { BroadcastTypeBadge } from "@/components/BroadcastTypeBadge";

const fmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Avatar צבעוני מהאות הראשונה של שם הרב — fallback כשאין posterUrl
function rabbiAvatar(name: string): { letter: string; bg: string } {
  const cleaned = name.replace(/^הרב\s+/, "").trim();
  const letter = cleaned.charAt(0) || "?";
  const palette = [
    "from-primary to-primary-hover",
    "from-gold to-gold-soft",
    "from-live to-emerald-700",
    "from-purple-500 to-purple-700",
    "from-pink-500 to-pink-700",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-700",
    "from-rose-500 to-red-700",
  ];
  const hash = Array.from(cleaned).reduce((a, c) => a + c.charCodeAt(0), 0);
  return { letter, bg: palette[hash % palette.length] };
}

export function LessonCard({ lesson }: { lesson: MockLesson & { posterUrl?: string | null } }) {
  const { letter, bg } = rabbiAvatar(lesson.rabbiName);

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="card group block overflow-hidden transition hover:border-primary/40"
    >
      {/* Poster / Avatar — תמיד יש משהו */}
      <div className="relative h-32 w-full overflow-hidden">
        {lesson.posterUrl ? (
          <Image
            src={lesson.posterUrl}
            alt={lesson.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
            <span className="hebrew-serif text-6xl font-bold text-white/95 drop-shadow">{letter}</span>
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
