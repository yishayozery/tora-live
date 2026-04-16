"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, ChevronRight, ChevronLeft, Radio, Trash2, Plus } from "lucide-react";

type Source = {
  id: string;
  fileUrl: string;
  fileName: string | null;
  currentPage: number;
  totalPages: number | null;
  isLiveFollow: boolean;
};

export function SourcesManager({
  lessonId,
  initialSources,
}: {
  lessonId: string;
  initialSources: Source[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: fileUrl.trim(),
          fileName: fileName.trim() || null,
          totalPages: totalPages ? Number(totalPages) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "שגיאה בהוספת מקור");
      setSources((prev) => [...prev, data.source]);
      setFileUrl("");
      setFileName("");
      setTotalPages("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function patchSource(sourceId: string, patch: Partial<Pick<Source, "currentPage" | "isLiveFollow">>) {
    const prev = sources;
    setSources((s) => s.map((x) => (x.id === sourceId ? { ...x, ...patch } : x)));
    try {
      const res = await fetch(`/api/lessons/${lessonId}/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "שגיאה בעדכון");
      }
    } catch (err) {
      setSources(prev);
      setError(err instanceof Error ? err.message : "שגיאה");
    }
  }

  async function deleteSource(sourceId: string) {
    if (!confirm("למחוק את המקור הזה?")) return;
    const prev = sources;
    setSources((s) => s.filter((x) => x.id !== sourceId));
    try {
      const res = await fetch(`/api/lessons/${lessonId}/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("שגיאה במחיקה");
    } catch (err) {
      setSources(prev);
      setError(err instanceof Error ? err.message : "שגיאה");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="hebrew-serif text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> הוספת מקור חדש
        </h2>
        <form onSubmit={addSource} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">כתובת ה-PDF</label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">שם קובץ (אופציונלי)</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="דף מקורות שיעור 1"
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">מספר עמודים כולל (אופציונלי)</label>
              <input
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="10"
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink"
              />
            </div>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "מוסיף..." : "הוסף מקור"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="hebrew-serif text-xl font-bold">מקורות קיימים ({sources.length})</h2>
        {sources.length === 0 && (
          <Card>
            <p className="text-ink-muted text-sm">עדיין לא הוספת מקורות לשיעור זה.</p>
          </Card>
        )}
        {sources.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">
                    {s.fileName || "מקור ללא שם"}
                  </div>
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary truncate block"
                    dir="ltr"
                  >
                    {s.fileUrl}
                  </a>
                </div>
              </div>
              <button
                onClick={() => deleteSource(s.id)}
                className="text-danger hover:bg-danger/10 rounded-btn p-2"
                aria-label="מחיקה"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant={s.isLiveFollow ? "gold" : "secondary"}
                size="sm"
                onClick={() => patchSource(s.id, { isLiveFollow: !s.isLiveFollow })}
              >
                <Radio className="w-4 h-4" />
                {s.isLiveFollow ? "עצור שידור חי" : "התחל ליווי"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => patchSource(s.id, { currentPage: Math.max(1, s.currentPage - 1) })}
                  disabled={s.currentPage <= 1}
                  aria-label="עמוד קודם"
                >
                  <ChevronRight className="w-4 h-4" />
                  קודם
                </Button>
                <div className="text-lg font-bold text-ink min-w-[4rem] text-center tabular-nums">
                  {s.currentPage}
                  {s.totalPages ? <span className="text-ink-muted text-sm"> / {s.totalPages}</span> : null}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    patchSource(s.id, {
                      currentPage: s.totalPages ? Math.min(s.totalPages, s.currentPage + 1) : s.currentPage + 1,
                    })
                  }
                  disabled={s.totalPages ? s.currentPage >= s.totalPages : false}
                  aria-label="עמוד הבא"
                >
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {s.isLiveFollow && (
                <span className="inline-flex items-center gap-1 text-live bg-live/10 rounded-full px-3 py-1 text-xs font-medium">
                  <Radio className="w-3 h-3" /> משודר עכשיו
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
