import Link from "next/link";
import { Radio, Users, MessageSquare, FileText, ExternalLink, Maximize2, Video } from "lucide-react";
import { pluralize } from "@/lib/utils";

export type LiveLesson = {
  id: string;
  title: string;
  rabbiName: string;
  rabbiSlug: string;
  viewerCount?: number;
  /** YouTube embed URL (https://www.youtube.com/embed/XXX) — אם זה YouTube נטמיע אותו */
  embedUrl?: string | null;
  /** URL חיצוני (Zoom/אחר) שלא ניתן להטמעה — נפתח בלשונית חדשה */
  externalUrl?: string | null;
  /** האם יש שיעור הקלטה? (סימן ל-sources) */
  hasSources?: boolean;
};

function isYouTubeEmbed(url: string | null | undefined): boolean {
  return !!url && /youtube\.com\/embed\//.test(url);
}

function isZoomUrl(url: string | null | undefined): boolean {
  return !!url && /zoom\.us\//.test(url);
}

export function LiveNowStrip({ lessons }: { lessons: LiveLesson[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-live"></span>
        </span>
        <h2 className="hebrew-serif text-2xl font-bold text-ink">משדרים עכשיו</h2>
        <span className="text-sm text-ink-muted">
          {lessons.length === 0 ? "אין שיעורים חיים כרגע" : pluralize(lessons.length, "שיעור חי", "שיעורים חיים")}
        </span>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-white p-8 text-center">
          <Radio className="w-8 h-8 text-ink-muted mx-auto mb-2" />
          <p className="text-ink-muted">אין כרגע שיעורים בשידור חי. השיעור הבא יתחיל בקרוב.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {lessons.map((l) => {
            const youtube = isYouTubeEmbed(l.embedUrl) ? l.embedUrl : null;
            const zoom = isZoomUrl(l.externalUrl);
            const externalOnly = !youtube && l.externalUrl;
            const lessonHref = `/lesson/${l.id}`;

            return (
              <article key={l.id} className="rounded-card border border-live/30 bg-white shadow-card overflow-hidden">
                {/* === Player area === */}
                <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                  {youtube ? (
                    <iframe
                      src={youtube}
                      title={l.title}
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-live/80 to-primary/70 flex flex-col items-center justify-center text-white text-center px-4">
                      {zoom ? (
                        <>
                          <Video className="w-12 h-12 mb-2 opacity-90" />
                          <p className="text-sm font-medium mb-3">שידור Zoom</p>
                          <a
                            href={l.externalUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-live font-bold px-5 py-2.5 rounded-btn shadow-soft hover:bg-paper-soft transition active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                            הצטרף לשידור
                          </a>
                        </>
                      ) : externalOnly ? (
                        <>
                          <Radio className="w-12 h-12 mb-2 opacity-90" />
                          <a
                            href={l.externalUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-live font-bold px-5 py-2.5 rounded-btn shadow-soft hover:bg-paper-soft transition active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                            פתח שידור
                          </a>
                        </>
                      ) : (
                        <Link
                          href={lessonHref}
                          className="inline-flex items-center gap-2 bg-white text-live font-bold px-5 py-2.5 rounded-btn shadow-soft"
                        >
                          <Radio className="w-4 h-4" />
                          לדף השיעור
                        </Link>
                      )}
                    </div>
                  )}

                  {/* LIVE badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-live text-white text-xs font-bold px-2.5 py-1 rounded-full shadow z-10">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </div>

                  {l.viewerCount != null && l.viewerCount > 0 && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                      <Users className="w-3 h-3" /> {l.viewerCount.toLocaleString("he-IL")}
                    </div>
                  )}
                </div>

                {/* === Info === */}
                <div className="p-4">
                  <Link href={lessonHref} className="block group">
                    <h3 className="hebrew-serif font-bold text-ink line-clamp-2 group-hover:text-primary transition">
                      {l.title}
                    </h3>
                    <p className="text-sm text-ink-muted mt-1">
                      {l.rabbiSlug ? (
                        <Link href={`/rabbi/${l.rabbiSlug}`} className="hover:text-primary">{l.rabbiName}</Link>
                      ) : l.rabbiName}
                    </p>
                  </Link>

                  {/* === Quick actions === */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={lessonHref}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      צפייה מלאה
                    </Link>
                    <Link
                      href={`${lessonHref}#chat`}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-paper-soft text-ink-soft text-sm font-medium hover:bg-white hover:text-ink border border-border transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      צ׳אט
                    </Link>
                    {l.hasSources && (
                      <Link
                        href={`${lessonHref}#sources`}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-paper-soft text-ink-soft text-sm font-medium hover:bg-white hover:text-ink border border-border transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        מקורות
                      </Link>
                    )}
                    {l.externalUrl && youtube && (
                      <a
                        href={l.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-paper-soft text-ink-soft text-sm font-medium hover:bg-white hover:text-ink border border-border transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
