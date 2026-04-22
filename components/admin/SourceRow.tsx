"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Power, Trash2, RefreshCw, ShieldCheck, Shield } from "lucide-react";

type Source = {
  id: string;
  platform: string;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  rabbiName: string | null;
  notes: string | null;
  enabled: boolean;
  trusted?: boolean;
  lastCheckedAt: string | null;
  lastFoundAt: string | null;
  totalDiscovered: number;
  lessonCount: number;
};

export function SourceRow({ source }: { source: Source }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !source.enabled }),
    });
    setBusy(false);
    router.refresh();
  }

  async function toggleTrusted() {
    const next = !source.trusted;
    if (next && !confirm(
      `לסמן את "${source.channelTitle}" כמקור מהימן?\n\n` +
      `משמעות: כל שיעור/שידור חי שיזוהה ממנו יפורסם אוטומטית באתר — ללא אישור אדמין.\n\n` +
      `השתמש רק במקורות שאתה סומך עליהם 100%.`
    )) return;
    setBusy(true);
    await fetch(`/api/admin/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trusted: next }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`למחוק את המקור "${source.channelTitle}"?\nשיעורים שנוצרו ממנו יישארו.`)) return;
    setBusy(true);
    await fetch(`/api/admin/sources/${source.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  async function scanNow() {
    setBusy(true);
    const res = await fetch(`/api/admin/sources/${source.id}/scan`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    router.refresh();
    alert(`סריקה הסתיימה:\n${JSON.stringify(data, null, 2)}`);
  }

  const last = source.lastCheckedAt ? new Date(source.lastCheckedAt).toLocaleString("he-IL") : "לא נסרק עדיין";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-ink">{source.channelTitle}</span>
            {source.rabbiName && source.rabbiName !== source.channelTitle && (
              <span className="text-sm text-ink-muted">({source.rabbiName})</span>
            )}
            {source.trusted && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-live bg-live/10 border border-live/30 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" />
                מהימן · פרסום אוטומטי
              </span>
            )}
            {!source.enabled && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted bg-paper-soft border border-border rounded-full px-2 py-0.5">
                מושבת
              </span>
            )}
            <a
              href={source.channelUrl}
              target="_blank" rel="noreferrer"
              className="text-primary hover:underline text-sm inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              YouTube
            </a>
          </div>
          <div className="mt-1 text-xs text-ink-muted" dir="ltr">{source.channelId}</div>
          <div className="mt-2 text-sm text-ink-soft flex flex-wrap gap-x-4 gap-y-1">
            <span>שיעורים נמצאו: <strong>{source.lessonCount}</strong></span>
            <span>בדיקה אחרונה: {last}</span>
          </div>
          {source.notes && <div className="mt-2 text-sm text-ink-muted italic">{source.notes}</div>}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={scanNow} disabled={busy}>
            <RefreshCw className="w-3 h-3" />
            סרוק עכשיו
          </Button>
          <Button
            size="sm"
            variant={source.trusted ? "primary" : "secondary"}
            onClick={toggleTrusted}
            disabled={busy}
            title={source.trusted ? "לבטל סימון מהימן" : "סמן כמהימן — פרסום אוטומטי"}
          >
            {source.trusted ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
            {source.trusted ? "מהימן ✓" : "סמן מהימן"}
          </Button>
          <Button size="sm" variant="secondary" onClick={toggle} disabled={busy}>
            <Power className="w-3 h-3" />
            {source.enabled ? "השבת" : "הפעל"}
          </Button>
          <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
            <Trash2 className="w-3 h-3" />
            מחק
          </Button>
        </div>
      </div>
    </Card>
  );
}
