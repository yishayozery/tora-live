"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heart, BookOpen, MessageSquare, Mail, CheckCircle2 } from "lucide-react";

type Props = {
  initial: { name: string; email: string };
  stats: { following: number; bookmarks: number; questions: number; requests: number };
};

export function StudentProfileForm({ initial, stats }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה בשמירה");
      return;
    }
    setOk(true);
    router.refresh();
  }

  const statItems = [
    { icon: Heart, label: "רבנים שאני עוקב", value: stats.following },
    { icon: BookOpen, label: "שיעורים בלוח", value: stats.bookmarks },
    { icon: MessageSquare, label: "שאלות ששאלתי", value: stats.questions },
    { icon: Mail, label: "פניות לרבנים", value: stats.requests },
  ];

  return (
    <div className="space-y-6">
      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-ink">{value}</div>
              <div className="text-xs text-ink-muted">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* עריכת פרופיל */}
      <Card>
        <CardTitle>עריכת פרטים</CardTitle>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-medium">שם</label>
            <input
              required minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-btn border border-border bg-white"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-medium">מייל</label>
            <input
              value={initial.email}
              disabled
              className="w-full h-11 px-3 rounded-btn border border-border bg-paper-soft text-ink-muted cursor-not-allowed" dir="ltr"
            />
            <p className="text-xs text-ink-muted mt-1">לא ניתן לשנות מייל</p>
          </div>
          {err && <div className="text-sm text-danger">{err}</div>}
          {ok && (
            <div className="text-sm text-live flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> השינויים נשמרו
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
