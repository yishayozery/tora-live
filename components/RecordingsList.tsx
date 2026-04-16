"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Play, Loader2 } from "lucide-react";

type Recording = {
  id: string;
  duration: number;
  created: string;
  download?: string;
  playback?: string;
};

export function RecordingsList({ lessonId }: { lessonId: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/recordings`);
      if (res.ok) {
        const data = await res.json();
        setRecordings(data.recordings ?? []);
        setExpiresAt(data.expiresAt);
      }
    } catch {}
    setLoading(false);
    setLoaded(true);
  }

  if (!loaded) {
    return (
      <Button size="sm" variant="gold" onClick={load} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {loading ? "טוען..." : "הצג הקלטות"}
      </Button>
    );
  }

  if (recordings.length === 0) {
    return <div className="text-xs text-ink-muted">אין הקלטות זמינות (ייתכן שעדיין בעיבוד).</div>;
  }

  return (
    <div className="space-y-2">
      {recordings.map((r) => (
        <div key={r.id} className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted text-xs">
            {Math.floor((r.duration || 0) / 60)} דק׳
          </span>
          {r.playback && (
            <a href={r.playback} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
              <Play className="w-3 h-3" /> צפייה
            </a>
          )}
          {r.download && (
            <a href={r.download} target="_blank" rel="noreferrer" className="text-gold hover:underline flex items-center gap-1">
              <Download className="w-3 h-3" /> הורדה
            </a>
          )}
        </div>
      ))}
      {expiresAt && (
        <div className="text-[10px] text-ink-muted">
          ההקלטות יימחקו ב-{new Date(expiresAt).toLocaleDateString("he-IL")}
        </div>
      )}
    </div>
  );
}
