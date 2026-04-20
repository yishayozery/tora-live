"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, X, ExternalLink, Calendar, Clock, MapPin, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

type Suggestion = {
  id: string;
  title: string;
  description: string;
  rabbiName: string | null;
  scheduledAt: string | null;
  durationMin: number | null;
  locationName: string | null;
  url: string;
  posterUrl: string | null;
  broadcastType: string;
  source: string;
  sourceType: string;
  rawContent: string | null;
  confidence: string;
  status: string;
  rejectReason: string | null;
  approvedLessonId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  TELEGRAM: "📱 טלגרם",
  FACEBOOK: "📘 פייסבוק",
  INSTAGRAM: "📷 אינסטגרם",
  TWITTER: "🐦 טוויטר",
  NEWS: "📰 חדשות",
  GOOGLE: "🔍 גוגל",
  OTHER: "🌐 אחר",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  HIGH: "bg-live/10 text-live border-live/20",
  MEDIUM: "bg-gold-soft text-gold border-gold/30",
  LOW: "bg-paper-soft text-ink-muted border-border",
};

export function SuggestionRow({ suggestion: s }: { suggestion: Suggestion }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [edit, setEdit] = useState({
    title: s.title,
    rabbiName: s.rabbiName ?? "",
    scheduledAt: s.scheduledAt?.slice(0, 16) ?? "",
    durationMin: s.durationMin ?? 60,
    locationName: s.locationName ?? "",
    broadcastType: s.broadcastType,
  });
  const [rejectReason, setRejectReason] = useState("");

  async function approve() {
    if (!edit.scheduledAt) {
      alert("חסר תאריך — עדכן ואז אשר");
      setEditing(true);
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/suggestions/${s.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        title: edit.title,
        rabbiName: edit.rabbiName || undefined,
        scheduledAt: new Date(edit.scheduledAt).toISOString(),
        durationMin: Number(edit.durationMin),
        locationName: edit.locationName || undefined,
        broadcastType: edit.broadcastType,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`שגיאה: ${j.error ?? "unknown"}`);
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (!confirm("לדחות את ההצעה הזו?")) return;
    setBusy(true);
    await fetch(`/api/admin/suggestions/${s.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejectReason: rejectReason || undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {s.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.posterUrl} alt={s.title} className="w-full sm:w-32 h-32 object-cover shrink-0" />
        )}
        <div className="flex-1 p-4">
          {/* Header: source + confidence + status */}
          <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-paper-soft text-ink-soft border border-border">
              {SOURCE_LABEL[s.sourceType] ?? s.sourceType}
            </span>
            <span className={`px-2 py-0.5 rounded-full border ${CONFIDENCE_COLOR[s.confidence] ?? CONFIDENCE_COLOR.MEDIUM}`}>
              ביטחון: {s.confidence === "HIGH" ? "גבוה" : s.confidence === "LOW" ? "נמוך" : "בינוני"}
            </span>
            {s.status === "APPROVED" && (
              <span className="px-2 py-0.5 rounded-full bg-live/10 text-live border border-live/20">✓ אושר</span>
            )}
            {s.status === "REJECTED" && (
              <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">✗ נדחה</span>
            )}
            <span className="text-ink-muted">· {new Date(s.createdAt).toLocaleString("he-IL")}</span>
          </div>

          {/* Title + meta */}
          {!editing ? (
            <>
              <h3 className="font-bold text-ink mb-1">{s.title}</h3>
              <div className="text-sm text-ink-soft flex flex-wrap gap-x-4 gap-y-1 mb-2">
                {s.rabbiName && <span>🎤 {s.rabbiName}</span>}
                {s.scheduledAt && <span><Calendar className="inline w-3 h-3 ml-1" />{new Date(s.scheduledAt).toLocaleString("he-IL")}</span>}
                {s.durationMin && <span><Clock className="inline w-3 h-3 ml-1" />{s.durationMin} דק׳</span>}
                {s.locationName && <span><MapPin className="inline w-3 h-3 ml-1" />{s.locationName}</span>}
              </div>
            </>
          ) : (
            <div className="space-y-2 mb-3">
              <input className="w-full h-10 px-3 rounded-btn border border-border text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="כותרת" />
              <div className="grid sm:grid-cols-2 gap-2">
                <input className="h-10 px-3 rounded-btn border border-border text-sm" value={edit.rabbiName} onChange={(e) => setEdit({ ...edit, rabbiName: e.target.value })} placeholder="שם הרב" />
                <input type="datetime-local" className="h-10 px-3 rounded-btn border border-border text-sm" value={edit.scheduledAt} onChange={(e) => setEdit({ ...edit, scheduledAt: e.target.value })} />
                <input type="number" className="h-10 px-3 rounded-btn border border-border text-sm" value={edit.durationMin} onChange={(e) => setEdit({ ...edit, durationMin: Number(e.target.value) })} placeholder="משך בדקות" min={5} max={720} />
                <input className="h-10 px-3 rounded-btn border border-border text-sm" value={edit.locationName} onChange={(e) => setEdit({ ...edit, locationName: e.target.value })} placeholder="מיקום" />
                <select className="h-10 px-3 rounded-btn border border-border text-sm sm:col-span-2" value={edit.broadcastType} onChange={(e) => setEdit({ ...edit, broadcastType: e.target.value })}>
                  <option value="LESSON">שיעור</option>
                  <option value="PRAYER">תפילה</option>
                  <option value="EVENT">אירוע</option>
                </select>
              </div>
            </div>
          )}

          {/* מקור — בולט עם URL מלא */}
          <div className="mb-3 p-2 rounded-btn bg-paper-soft border border-border">
            <div className="text-[11px] text-ink-muted mb-0.5">📡 מקור המידע:</div>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
              dir="ltr"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{s.url}</span>
            </a>
            <div className="text-[11px] text-ink-muted mt-1">
              סורק: <code className="bg-white px-1 rounded">{s.source}</code>
            </div>
          </div>

          {/* Raw content (collapsed) */}
          {s.rawContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1 mb-2"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <MessageSquare className="w-3 h-3" />
              {expanded ? "הסתר טקסט מקור" : "הצג טקסט מקור"}
            </button>
          )}
          {expanded && s.rawContent && (
            <div className="text-xs text-ink-soft bg-paper-soft p-2 rounded-btn whitespace-pre-line mb-3 max-h-48 overflow-auto">
              {s.rawContent}
            </div>
          )}

          {s.rejectReason && (
            <div className="text-xs text-danger mb-2">סיבת דחייה: {s.rejectReason}</div>
          )}

          {/* Actions */}
          {s.status === "PENDING" && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              <Button size="sm" onClick={approve} disabled={busy} className="bg-live hover:bg-live/90">
                <Check className="w-4 h-4" />
                {editing ? "אשר עם השינויים" : "אשר"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(!editing)} disabled={busy}>
                {editing ? "ביטול עריכה" : "ערוך לפני אישור"}
              </Button>
              <Button size="sm" variant="danger" onClick={reject} disabled={busy}>
                <X className="w-4 h-4" />
                דחה
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
