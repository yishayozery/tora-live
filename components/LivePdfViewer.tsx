"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Radio, BookOpen } from "lucide-react";

type Props = {
  lessonId: string;
  sourceId: string;
  fileUrl: string;
  fileName: string | null;
  initialPage: number;
  totalPages: number | null;
  initialLive: boolean;
};

export function LivePdfViewer({
  lessonId,
  sourceId,
  fileUrl,
  fileName,
  initialPage,
  totalPages,
  initialLive,
}: Props) {
  const [rabbiPage, setRabbiPage] = useState(initialPage);
  const [isLive, setIsLive] = useState(initialLive);
  const [viewerPage, setViewerPage] = useState(initialPage);
  const [following, setFollowing] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Subscribe to SSE stream
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;

    try {
      es = new EventSource(`/api/lessons/${lessonId}/sources/${sourceId}/stream`);
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(ev.data);
          if (typeof data.currentPage === "number") setRabbiPage(data.currentPage);
          if (typeof data.isLiveFollow === "boolean") setIsLive(data.isLiveFollow);
        } catch {}
      };
      es.onerror = () => {
        // Let browser reconnect automatically
      };
    } catch {}

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [lessonId, sourceId]);

  // Auto-follow rabbi's page when user hasn't taken over
  useEffect(() => {
    if (following && isLive) {
      setViewerPage(rabbiPage);
    }
  }, [rabbiPage, isLive, following]);

  const pdfSrc = `${fileUrl}#page=${viewerPage}`;
  const behind = isLive && following === false && viewerPage !== rabbiPage;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="hebrew-serif text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {fileName || "דף מקורות"}
        </h2>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-btn border border-border bg-white text-ink text-sm hover:bg-paper-soft"
        >
          <FileText className="w-4 h-4" />
          הורדה
        </a>
      </div>

      {isLive && (
        <div
          className={`mb-3 rounded-card border px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${
            following ? "bg-live/10 border-live/30 text-live" : "bg-gold/10 border-gold/40 text-gold"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Radio className="w-4 h-4 animate-pulse" />
            {following ? (
              <span>הרב בעמוד {rabbiPage} — הדף מתעדכן אוטומטית</span>
            ) : (
              <span>הרב בעמוד {rabbiPage} (אתה רואה עמוד {viewerPage})</span>
            )}
          </div>
          {behind && (
            <button
              onClick={() => {
                setFollowing(true);
                setViewerPage(rabbiPage);
              }}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-btn bg-live text-white text-xs font-medium hover:opacity-90"
            >
              התיישר אל הרב
            </button>
          )}
        </div>
      )}

      <div className="rounded-card overflow-hidden border border-border bg-white">
        <iframe
          ref={iframeRef}
          src={pdfSrc}
          title={fileName || "דף מקורות"}
          className="w-full h-[70vh] sm:h-[80vh]"
          loading="lazy"
        />
      </div>

      {/* Manual navigation (user takes over) */}
      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        <button
          onClick={() => {
            setFollowing(false);
            setViewerPage((p) => Math.max(1, p - 1));
          }}
          className="h-9 px-3 rounded-btn border border-border bg-white hover:bg-paper-soft"
          aria-label="עמוד קודם"
        >
          עמוד קודם
        </button>
        <span className="text-ink-muted tabular-nums min-w-[4rem] text-center">
          עמוד {viewerPage}
          {totalPages ? ` / ${totalPages}` : ""}
        </span>
        <button
          onClick={() => {
            setFollowing(false);
            setViewerPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1));
          }}
          className="h-9 px-3 rounded-btn border border-border bg-white hover:bg-paper-soft"
          aria-label="עמוד הבא"
        >
          עמוד הבא
        </button>
      </div>
    </div>
  );
}
