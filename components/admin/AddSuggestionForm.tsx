"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link as LinkIcon, Loader2, Check, AlertCircle } from "lucide-react";

export function AddSuggestionForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [extra, setExtra] = useState({
    title: "", rabbiName: "", scheduledAt: "", durationMin: 60, locationName: "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; og?: any } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/suggestions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: extra.title.trim() || undefined,
          rabbiName: extra.rabbiName.trim() || undefined,
          scheduledAt: extra.scheduledAt || undefined,
          durationMin: extra.durationMin || undefined,
          locationName: extra.locationName.trim() || undefined,
          notes: extra.notes.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, msg: j.error || "שגיאה" });
      } else {
        setResult({
          ok: true,
          msg: j.fetched
            ? `✅ נשלפו פרטים מהדף: "${j.og?.title?.slice(0, 60) ?? "—"}"`
            : "✅ נשמר עם הנתונים שסופקו (לא הצליח לשלוף OG)",
          og: j.og,
        });
        setUrl("");
        setExtra({ title: "", rabbiName: "", scheduledAt: "", durationMin: 60, locationName: "", notes: "" });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-ink">הוספה ידנית — הדבק קישור (פייסבוק / אינסטגרם / אתר)</h3>
        </div>

        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/events/... או https://instagram.com/p/..."
            dir="ltr"
            required
            className="flex-1 h-11 px-3 rounded-btn border border-border bg-white text-sm"
          />
          <Button type="submit" disabled={busy || !url.trim()}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> שולף...</> : "שלוף ושמור"}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setAdvanced(!advanced)}
          className="text-xs text-primary hover:underline"
        >
          {advanced ? "הסתר" : "+ פרטים נוספים (אופציונלי — אם ה-OG חסר)"}
        </button>

        {advanced && (
          <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-border">
            <input className="h-10 px-3 rounded-btn border border-border text-sm" placeholder="כותרת (אם חסר ב-OG)" value={extra.title} onChange={(e) => setExtra({ ...extra, title: e.target.value })} />
            <input className="h-10 px-3 rounded-btn border border-border text-sm" placeholder="שם הרב/הדובר" value={extra.rabbiName} onChange={(e) => setExtra({ ...extra, rabbiName: e.target.value })} />
            <input type="datetime-local" className="h-10 px-3 rounded-btn border border-border text-sm" value={extra.scheduledAt} onChange={(e) => setExtra({ ...extra, scheduledAt: e.target.value })} />
            <input type="number" min={5} max={720} className="h-10 px-3 rounded-btn border border-border text-sm" placeholder="משך (דקות)" value={extra.durationMin} onChange={(e) => setExtra({ ...extra, durationMin: Number(e.target.value) })} />
            <input className="h-10 px-3 rounded-btn border border-border text-sm sm:col-span-2" placeholder="מיקום" value={extra.locationName} onChange={(e) => setExtra({ ...extra, locationName: e.target.value })} />
            <textarea className="px-3 py-2 rounded-btn border border-border text-sm sm:col-span-2" rows={2} placeholder="הערות פנימיות לאדמין" value={extra.notes} onChange={(e) => setExtra({ ...extra, notes: e.target.value })} />
          </div>
        )}

        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-btn text-sm ${result.ok ? "bg-live/10 text-live border border-live/20" : "bg-danger/10 text-danger border border-danger/20"}`}>
            {result.ok ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>{result.msg}</div>
          </div>
        )}

        <p className="text-xs text-ink-muted leading-relaxed">
          💡 <strong>פייסבוק</strong>: העתק לינק לאירוע פומבי / פוסט פומבי.
          המערכת מנסה לשלוף תמונה + כותרת + תיאור אוטומטית.
          אם פייסבוק חוסם — תמלא ידנית עם &quot;פרטים נוספים&quot;.
        </p>
      </form>
    </Card>
  );
}
