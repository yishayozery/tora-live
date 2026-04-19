"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Rabbi = { id: string; name: string; slug: string };

export function AddSourceForm({ rabbis }: { rabbis: Rabbi[] }) {
  const router = useRouter();
  const [channelUrl, setChannelUrl] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [rabbiName, setRabbiName] = useState("");
  const [rabbiId, setRabbiId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!channelId.match(/^UC[a-zA-Z0-9_-]{20,}$/)) {
      setError("channelId לא תקין — חייב להתחיל ב-UC ולהיות ~24 תווים");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YOUTUBE",
        channelId: channelId.trim(),
        channelTitle: channelTitle.trim() || rabbiName.trim() || channelId,
        channelUrl: channelUrl.trim() || `https://www.youtube.com/channel/${channelId}`,
        rabbiName: rabbiName.trim() || null,
        rabbiId: rabbiId || null,
        notes: notes.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "שגיאה בהוספה");
      return;
    }
    setChannelUrl(""); setChannelId(""); setChannelTitle(""); setRabbiName(""); setRabbiId(""); setNotes("");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-ink">channelId *</span>
            <input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxx"
              dir="ltr"
              required
              className="mt-1 w-full h-10 px-3 rounded-btn border border-border bg-white text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink">שם הערוץ</span>
            <input
              value={channelTitle}
              onChange={(e) => setChannelTitle(e.target.value)}
              placeholder="למשל: הרב אורי שרקי"
              className="mt-1 w-full h-10 px-3 rounded-btn border border-border bg-white text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink">URL לערוץ</span>
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@example"
            dir="ltr"
            className="mt-1 w-full h-10 px-3 rounded-btn border border-border bg-white text-sm"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-ink">שם הרב (תצוגה)</span>
            <input
              value={rabbiName}
              onChange={(e) => setRabbiName(e.target.value)}
              placeholder="הרב אורי שרקי"
              className="mt-1 w-full h-10 px-3 rounded-btn border border-border bg-white text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink">קשר לרב קיים (אופציונלי)</span>
            <select
              value={rabbiId}
              onChange={(e) => setRabbiId(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-btn border border-border bg-white text-sm"
            >
              <option value="">— לא מקושר (נשמר תחת אדמין) —</option>
              {rabbis.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink">הערות</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-btn border border-border bg-white text-sm"
          />
        </label>

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "מוסיף..." : "הוסף מקור"}</Button>
        </div>
      </form>
    </Card>
  );
}
