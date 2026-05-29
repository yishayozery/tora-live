"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Radio, Video, Copy, Eye, EyeOff, Settings, CheckCircle2 } from "lucide-react";

export type RoomStatus = "live" | "ready" | "offline";

export interface RoomCardProps {
  slug: string;
  room: {
    id: string;
    name: string;
    description: string | null;
    isBroadcasting: boolean;
    rtmpUrl: string | null;
    streamKey: string | null;
    playbackUrl: string | null;
  };
  status: RoomStatus;
  activeLessonTitle: string | null;
}

const STATUS_META: Record<RoomStatus, { label: string; sub: string; dot: string; chip: string; border: string }> = {
  live: {
    label: "משדר עכשיו",
    sub: "השידור באוויר",
    dot: "bg-live",
    chip: "bg-live/10 text-live border-live/30",
    border: "border-live",
  },
  ready: {
    label: "מוכן",
    sub: "מצלמה מחוברת, ממתינה",
    dot: "bg-gold",
    chip: "bg-gold/10 text-gold border-gold/30",
    border: "border-gold/40",
  },
  offline: {
    label: "אופליין",
    sub: "מצלמה לא מחוברת",
    dot: "bg-danger",
    chip: "bg-danger/10 text-danger border-danger/30",
    border: "border-border",
  },
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard לא זמין */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`העתק ${label}`}
      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-btn border border-border bg-white text-ink-soft hover:border-primary hover:text-primary text-xs font-medium transition shrink-0"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-live" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "הועתק" : "העתק"}
    </button>
  );
}

export function RoomCard({ slug, room, status, activeLessonTitle }: RoomCardProps) {
  const router = useRouter();
  const [broadcasting, setBroadcasting] = React.useState(room.isBroadcasting);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showKey, setShowKey] = React.useState(false);

  const meta = STATUS_META[broadcasting ? "live" : status];

  async function toggle() {
    if (pending) return;
    const next = !broadcasting;
    setBroadcasting(next); // optimistic
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${slug}/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBroadcasting: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "שגיאה בעדכון השידור");
      }
      router.refresh();
    } catch (e) {
      setBroadcasting(!next); // rollback
      setError(e instanceof Error ? e.message : "שגיאה בעדכון השידור");
    } finally {
      setPending(false);
    }
  }

  const maskedKey = room.streamKey ? "•".repeat(Math.min(room.streamKey.length, 28)) : "—";

  return (
    <Card className={`flex flex-col gap-4 border-2 ${meta.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="hebrew-serif text-xl font-bold text-ink truncate">{room.name}</h3>
          {room.description && <p className="text-sm text-ink-muted mt-0.5 truncate">{room.description}</p>}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-semibold whitespace-nowrap ${meta.chip}`}
        >
          <span className={`w-2 h-2 rounded-full ${meta.dot} ${broadcasting ? "animate-pulse" : ""}`} />
          {meta.label}
        </span>
      </div>

      <div className="text-sm text-ink-soft">
        {meta.sub}
        {broadcasting && activeLessonTitle && (
          <span className="block mt-1 font-semibold text-ink">{activeLessonTitle}</span>
        )}
      </div>

      <div>
        <Button
          variant={broadcasting ? "danger" : "primary"}
          size="md"
          className="w-full"
          onClick={toggle}
          disabled={pending}
        >
          <Radio className="w-4 h-4" />
          {broadcasting ? "עצור שידור" : "התחל שידור"}
        </Button>
        {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
      </div>

      <details className="group rounded-btn border border-border bg-paper-soft/60 [&[open]]:bg-paper-soft">
        <summary className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 text-sm font-medium text-ink-soft hover:text-primary">
          <Settings className="w-4 h-4" />
          פרטי חיבור (OBS / Pi)
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted mb-1">כתובת RTMP</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate text-xs bg-white border border-border rounded-btn px-2.5 py-1.5 ltr text-left" dir="ltr">
                {room.rtmpUrl || "—"}
              </code>
              {room.rtmpUrl && <CopyButton value={room.rtmpUrl} label="כתובת RTMP" />}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-ink-muted">מפתח שידור (סודי)</span>
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                aria-label={showKey ? "הסתר מפתח" : "הצג מפתח"}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKey ? "הסתר" : "הצג"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate text-xs bg-white border border-border rounded-btn px-2.5 py-1.5 ltr text-left" dir="ltr">
                {showKey ? room.streamKey || "—" : maskedKey}
              </code>
              {room.streamKey && <CopyButton value={room.streamKey} label="מפתח שידור" />}
            </div>
          </div>

          {room.playbackUrl && (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Video className="w-3.5 h-3.5" />
              ערוץ צפייה מוגדר
            </div>
          )}
        </div>
      </details>
    </Card>
  );
}
