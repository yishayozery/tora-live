"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Channel = "NONE" | "EMAIL" | "WHATSAPP" | "BOTH";

const OPTIONS: { value: Channel; label: string; hint: string }[] = [
  { value: "EMAIL", label: "מייל", hint: "התראות יישלחו למייל שלך עם קישור ישיר לשיעור." },
  { value: "WHATSAPP", label: "וואטסאפ", hint: "התראות יישלחו כהודעת וואטסאפ למספר שתזין." },
  { value: "BOTH", label: "שניהם", hint: "גם מייל וגם וואטסאפ." },
  { value: "NONE", label: "ללא", hint: "התראות יוצגו רק באתר (פעמון)." },
];

export function SettingsForm({
  initial,
}: {
  initial: { notifyChannel: Channel; phoneE164: string };
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>(initial.notifyChannel);
  const [phone, setPhone] = useState(initial.phoneE164);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const needsPhone = channel === "WHATSAPP" || channel === "BOTH";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    const res = await fetch("/api/me/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyChannel: channel, phoneE164: phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="text-sm text-ink-soft mb-2">איך לקבל תזכורות?</div>
          <div className="space-y-2">
            {OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex items-start gap-3 p-3 rounded-btn border cursor-pointer ${
                  channel === o.value ? "border-primary bg-primary-soft/30" : "border-border hover:bg-paper-soft"
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  checked={channel === o.value}
                  onChange={() => setChannel(o.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{o.label}</div>
                  <div className="text-xs text-ink-muted">{o.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {needsPhone && (
          <div>
            <label className="block text-sm text-ink-soft mb-1">מספר וואטסאפ (בפורמט בינלאומי)</label>
            <input
              type="tel"
              required={needsPhone}
              placeholder="+972501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-left"
            />
            <CardDescription>לדוגמה: +972501234567</CardDescription>
          </div>
        )}

        {err && <div className="text-sm text-danger">{err}</div>}
        {ok && <div className="text-sm text-live">ההגדרות נשמרו</div>}

        <Button type="submit" disabled={loading}>
          {loading ? "שומר..." : "שמור"}
        </Button>
      </form>
    </Card>
  );
}
