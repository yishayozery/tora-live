"use client";

// טופס יצירת חדר חדש למוסד + כרטיס הגדרות עם ה-credentials של השידור.
// לאחר יצירה מוצלחת, ה-credentials (RTMP + Stream Key) מוצגים פעם אחת —
// הם קבועים ומוקלדים ב-OBS / Raspberry Pi של החדר.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ObsSetupGuide } from "@/components/institution/ObsSetupGuide";
import { Plus, Copy, Eye, EyeOff, Radio, Check } from "lucide-react";

type RoomResult = {
  id: string;
  name: string;
  rtmpUrl: string | null;
  streamKey: string | null;
  playbackUrl: string | null;
};

export function CreateRoomForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 1) {
      setError("יש להזין שם לחדר");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/institutions/${slug}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "שגיאה ביצירת החדר");
        return;
      }
      setRoom(data as RoomResult);
      router.refresh();
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  // לאחר יצירה — מציגים את כרטיס ההגדרות עם ה-credentials.
  if (room) {
    return <RoomSetupCard slug={slug} room={room} />;
  }

  return (
    <Card>
      <CardTitle>פרטי החדר</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label htmlFor="room-name" className="block text-sm font-medium text-ink mb-1">
            שם החדר <span className="text-danger">*</span>
          </label>
          <input
            id="room-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: בית מדרש גדול"
            maxLength={80}
            required
            className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="room-desc" className="block text-sm font-medium text-ink mb-1">
            תיאור <span className="text-ink-muted font-normal">(רשות)</span>
          </label>
          <input
            id="room-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="לדוגמה: קומה ב׳, מול הארון"
            maxLength={200}
            className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={loading}>
            <Plus className="w-4 h-4" />
            {loading ? "יוצר חדר…" : "צור חדר"}
          </Button>
          <Link
            href={`/dashboard/institution/${slug}`}
            className="text-sm text-ink-muted hover:text-ink"
          >
            ביטול
          </Link>
        </div>
      </form>
    </Card>
  );
}

// === כרטיס הגדרות — מציג RTMP URL + Stream Key לאחר יצירת החדר ===
function RoomSetupCard({ slug, room }: { slug: string; room: RoomResult }) {
  return (
    <div className="space-y-5">
    <Card className="border-live/30 bg-live/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-live/15 text-live">
          <Radio className="w-5 h-5" />
        </span>
        <CardTitle className="mb-0">החדר "{room.name}" נוצר!</CardTitle>
      </div>

      <p className="text-sm text-ink-soft mb-4 leading-relaxed">
        הקלד את הפרטים האלה ב-OBS Studio (Settings → Stream → Custom) או ב-Raspberry Pi של
        החדר. פעם אחת — הם קבועים.
      </p>

      <div className="space-y-3">
        <CopyField label="RTMP URL" value={room.rtmpUrl} />
        <CopyField label="Stream Key" value={room.streamKey} secret />
      </div>

      <div className="mt-4 rounded-btn bg-gold-soft border border-gold/30 text-gold px-4 py-3 text-sm leading-relaxed">
        ⚠️ שמור את ה-Stream Key במקום בטוח — הוא סודי ולא יוצג שוב לאחר עזיבת הדף.
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Link href={`/dashboard/institution/${slug}`}>
          <Button variant="secondary">חזרה לדשבורד המוסד</Button>
        </Link>
      </div>
    </Card>

    {room.rtmpUrl && room.streamKey && (
      <ObsSetupGuide
        rtmpUrl={room.rtmpUrl}
        streamKey={room.streamKey}
        roomName={room.name}
      />
    )}
    </div>
  );
}

// === שדה עם כפתור העתקה (ואופציית הסתרה/חשיפה לסודות) ===
function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string | null;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const display = value
    ? revealed
      ? value
      : "•".repeat(Math.min(value.length, 32))
    : "—";

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <div className="flex items-stretch gap-2">
        <code
          dir="ltr"
          className="flex-1 min-w-0 h-11 px-3 inline-flex items-center rounded-btn border border-border bg-white text-ink text-sm font-mono truncate"
        >
          {display}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="w-11 shrink-0 inline-flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft text-ink"
            aria-label={revealed ? "הסתר" : "הצג"}
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          disabled={!value}
          className="w-11 shrink-0 inline-flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft text-ink disabled:opacity-50"
          aria-label="העתק"
        >
          {copied ? <Check className="w-4 h-4 text-live" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
