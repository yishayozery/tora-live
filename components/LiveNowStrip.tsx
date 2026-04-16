import Link from "next/link";
import { Radio, Users } from "lucide-react";

export type LiveLesson = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  viewerCount?: number;
};

export function LiveNowStrip({ lessons }: { lessons: LiveLesson[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-live"></span>
        </span>
        <h2 className="hebrew-serif text-2xl font-bold text-ink">משדרים עכשיו</h2>
        <span className="text-sm text-ink-muted">{lessons.length} שיעורים חיים</span>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-white p-8 text-center">
          <Radio className="w-8 h-8 text-ink-muted mx-auto mb-2" />
          <p className="text-ink-muted">אין כרגע שיעורים בשידור חי. השיעור הבא יתחיל בקרוב.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <Link
              key={l.id}
              href={`/lesson/${l.id}`}
              className="group rounded-card border border-border bg-white shadow-card hover:shadow-soft hover:border-live transition overflow-hidden"
            >
              <div className="relative h-32 bg-gradient-to-br from-live/80 to-primary/70 flex items-center justify-center">
                <Radio className="w-10 h-10 text-white/90" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-live text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </div>
                {l.viewerCount != null && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" /> {l.viewerCount.toLocaleString("he-IL")}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="hebrew-serif font-bold text-ink line-clamp-1 group-hover:text-primary transition">
                  {l.title}
                </h3>
                <p className="text-sm text-ink-muted mt-1">{l.rabbiName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
