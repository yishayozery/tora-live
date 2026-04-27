"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2, Pause, Play, Globe, Lock } from "lucide-react";
import type { WeekSchedule } from "@/lib/recurring-lessons";

const DAY_LABELS: Record<string, string> = {
  sun: "א׳",
  mon: "ב׳",
  tue: "ג׳",
  wed: "ד׳",
  thu: "ה׳",
  fri: "ו׳",
  sat: "ש",
};

type Template = {
  id: string;
  title: string;
  schedule: WeekSchedule;
  startDate: string;
  endDate: string;
  status: string;
  isPublic: boolean;
  lessonCount: number;
};

export function RecurringTemplateCard({ template }: { template: Template }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!confirm(`לבטל את הסדרה "${template.title}"?\n\nכל השיעורים העתידיים שטרם נערכו ידנית יימחקו.\nשיעורים שכבר התקיימו או עודכנו ידנית יישארו.`)) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/rabbi/recurring/${template.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      alert(`הסדרה בוטלה. נמחקו ${data.deletedLessons} שיעורים עתידיים.`);
      router.refresh();
    } else {
      alert("שגיאה בביטול הסדרה");
    }
  }

  async function toggleStatus() {
    setBusy(true);
    const newStatus = template.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await fetch(`/api/rabbi/recurring/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));

  // ימים פעילים בלבד
  const activeDays = Object.entries(template.schedule)
    .filter(([k, v]) => k !== "sat" && (v as any).enabled)
    .map(([k, v]) => ({ key: k, time: (v as any).time, durationMin: (v as any).durationMin }));

  const isActive = template.status === "ACTIVE";
  const isPaused = template.status === "PAUSED";
  const isCancelled = template.status === "CANCELLED";

  return (
    <Card className={
      isCancelled ? "opacity-60 border-danger/30"
      : isPaused ? "border-gold/30"
      : "border-primary/20"
    }>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-ink text-lg">{template.title}</h3>
            {template.isPublic ? (
              <span className="inline-flex items-center gap-1 text-xs bg-live/10 text-live border border-live/20 rounded-full px-2 py-0.5">
                <Globe className="w-3 h-3" /> ציבורי
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-paper-warm text-gold border border-gold/30 rounded-full px-2 py-0.5">
                <Lock className="w-3 h-3" /> פרטי
              </span>
            )}
            {isPaused && (
              <span className="text-xs bg-gold/10 text-gold border border-gold/30 rounded-full px-2 py-0.5">בהשהיה</span>
            )}
            {isCancelled && (
              <span className="text-xs bg-danger/10 text-danger border border-danger/30 rounded-full px-2 py-0.5">בוטל</span>
            )}
          </div>

          {/* ימים + שעות */}
          {activeDays.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {activeDays.map((d) => (
                <span
                  key={d.key}
                  className="inline-flex items-center gap-1 text-xs bg-primary-soft text-primary border border-primary/20 rounded-btn px-2 py-1"
                >
                  <strong>{DAY_LABELS[d.key]}</strong>
                  <span>{d.time}</span>
                  <span className="text-ink-muted">·{d.durationMin} דק׳</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">אין ימים פעילים</p>
          )}

          <div className="text-xs text-ink-muted">
            {fmtDate(template.startDate)} → {fmtDate(template.endDate)} · {template.lessonCount} שיעורים
          </div>
        </div>

        {!isCancelled && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button size="sm" variant="secondary" onClick={toggleStatus} disabled={busy}>
              {isActive ? <><Pause className="w-3.5 h-3.5" /> השהה</> : <><Play className="w-3.5 h-3.5" /> הפעל</>}
            </Button>
            <Button size="sm" variant="danger" onClick={cancel} disabled={busy}>
              <Trash2 className="w-3.5 h-3.5" /> בטל סדרה
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
