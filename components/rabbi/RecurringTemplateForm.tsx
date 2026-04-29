"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Globe, Lock, Repeat, ArrowRight } from "lucide-react";
import { BROADCAST_TYPES, LANGUAGES } from "@/lib/enums";

const DAYS = [
  { key: "sun", label: "יום ראשון" },
  { key: "mon", label: "יום שני" },
  { key: "tue", label: "יום שלישי" },
  { key: "wed", label: "יום רביעי" },
  { key: "thu", label: "יום חמישי" },
  { key: "fri", label: "יום שישי" },
] as const;

type DaySchedule = { enabled: boolean; time: string; durationMin: number };

const DEFAULT_DAY: DaySchedule = { enabled: true, time: "20:00", durationMin: 60 };
const FRIDAY_DAY: DaySchedule = { enabled: true, time: "13:00", durationMin: 45 };

type FormInitial = {
  title: string;
  description: string;
  categoryId: string;
  language: string;
  broadcastType: string;
  isPublic: boolean;
  schedule: Record<string, DaySchedule>;
  startDate: string;
  endDate: string;
};

export function RecurringTemplateForm({
  categories,
  mode = "create",
  templateId,
  initial,
}: {
  categories: { id: string; name: string }[];
  mode?: "create" | "edit";
  templateId?: string;
  initial?: FormInitial;
}) {
  const router = useRouter();

  const today = new Date();
  const sixMonthsLater = new Date(today.getTime() + 180 * 86400_000);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "he");
  const [broadcastType, setBroadcastType] = useState(initial?.broadcastType ?? "LESSON");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(initial?.schedule ?? {
    sun: { ...DEFAULT_DAY },
    mon: { ...DEFAULT_DAY },
    tue: { ...DEFAULT_DAY },
    wed: { ...DEFAULT_DAY },
    thu: { ...DEFAULT_DAY },
    fri: { ...FRIDAY_DAY },
  });

  const [startDate, setStartDate] = useState(initial?.startDate ?? today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initial?.endDate ?? sixMonthsLater.toISOString().slice(0, 10));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(key: string, patch: Partial<DaySchedule>) {
    setSchedule((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("יש להזין שם לשיעור");
      return;
    }
    const enabledCount = Object.values(schedule).filter((d) => d.enabled).length;
    if (enabledCount === 0) {
      setError("יש לבחור לפחות יום אחד פעיל");
      return;
    }
    setError(null);
    setBusy(true);

    try {
      const isEdit = mode === "edit" && templateId;
      const url = isEdit ? `/api/rabbi/recurring/${templateId}` : "/api/rabbi/recurring";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          categoryId: categoryId || null,
          language,
          broadcastType,
          isPublic,
          schedule: { ...schedule, sat: { enabled: false } },
          startDate,
          endDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "שגיאה ב" + (isEdit ? "עדכון" : "יצירה"));
        return;
      }
      const summary = isEdit
        ? `התבנית עודכנה. נמחקו ${data.deletedFutureLessons ?? 0} שיעורים עתידיים, נוצרו ${data.created ?? 0} חדשים לפי הלוח החדש.`
        : `נוצרו ${data.created} שיעורים. דולגו ${data.skippedShabbat} שבתות + ${data.skippedHoliday} חגים.`;
      alert("✅ " + summary);
      router.push("/dashboard/lessons/recurring");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full h-10 px-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <Link
          href="/dashboard/lessons/recurring"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2"
        >
          <ArrowRight className="w-3 h-3" /> חזרה לרשימה
        </Link>
        <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
          <Repeat className="w-7 h-7 text-primary" />
          {mode === "edit" ? "עריכת תבנית שיעור קבוע" : "תבנית שיעור קבוע"}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {mode === "edit"
            ? "שינויים יחולו על שיעורים עתידיים שלא נערכו ידנית. שיעורים שעודכנו ידנית או שכבר התקיימו — יישארו כמו שהם."
            : "קבע שעות לכל יום בשבוע. המערכת תיצור את השיעורים אוטומטית ל-6 חודשים קדימה. שבת וחגים מדולגים אוטומטית."}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        {/* פרטי שיעור */}
        <Card>
          <h3 className="font-bold text-sm mb-3">פרטי השיעור</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ink-soft mb-1">שם השיעור *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוגמה: שולחן ערוך — הלכות שבת"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">תיאור (אופציונלי)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-btn border border-border bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs text-ink-soft mb-1">קטגוריה</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">בלי קטגוריה</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-ink-soft mb-1">סוג</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className={inputCls}
                >
                  {BROADCAST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-soft mb-1">שפה</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={inputCls}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ציבורי / פרטי */}
            <div>
              <label className="block text-xs text-ink-soft mb-2">סוג השיעור</label>
              <div className="flex gap-2">
                <label className={`flex-1 cursor-pointer border-2 rounded-btn p-3 transition ${isPublic ? "border-primary bg-primary-soft/40" : "border-border hover:border-primary/40"}`}>
                  <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="sr-only" />
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">ציבורי</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">יופיע בלוח השיעורים של האתר. כל אחד יכול להצטרף.</p>
                </label>
                <label className={`flex-1 cursor-pointer border-2 rounded-btn p-3 transition ${!isPublic ? "border-gold bg-gold-soft/40" : "border-border hover:border-gold/40"}`}>
                  <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="sr-only" />
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" />
                    <span className="font-bold text-sm">פרטי</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">רק ביומן שלך. לא בלוח הציבורי.</p>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* לוח שעות */}
        <Card>
          <h3 className="font-bold text-sm mb-3">שעות השיעור — ימים בשבוע</h3>
          <p className="text-xs text-ink-muted mb-4">
            סמן את הימים שבהם השיעור מתקיים, וקבע שעה ומשך. שבת תמיד מבוטלת. חגים יידלגו אוטומטית.
          </p>
          <div className="space-y-2">
            {DAYS.map((d) => {
              const day = schedule[d.key];
              return (
                <div key={d.key} className={`flex items-center gap-3 p-3 rounded-btn border ${day.enabled ? "border-primary/30 bg-primary-soft/20" : "border-border bg-paper-soft"}`}>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => updateDay(d.key, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className={`font-medium text-sm ${day.enabled ? "text-ink" : "text-ink-muted"}`}>{d.label}</span>
                  </label>
                  {day.enabled && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-ink-muted">שעה:</span>
                        <input
                          type="time"
                          value={day.time}
                          onChange={(e) => updateDay(d.key, { time: e.target.value })}
                          className="h-9 px-2 rounded-btn border border-border bg-white text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-ink-muted">משך:</span>
                        <input
                          type="number"
                          value={day.durationMin}
                          onChange={(e) => updateDay(d.key, { durationMin: parseInt(e.target.value) || 60 })}
                          min={5}
                          max={480}
                          step={5}
                          className="h-9 w-16 px-2 rounded-btn border border-border bg-white text-sm text-center"
                        />
                        <span className="text-xs text-ink-muted">דק׳</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-3 p-3 rounded-btn border border-border bg-paper-soft opacity-60">
              <span className="font-medium text-sm text-ink-muted flex-1">שבת</span>
              <span className="text-xs text-ink-muted">לא משדרים בשבת</span>
            </div>
          </div>
        </Card>

        {/* טווח תאריכים */}
        <Card>
          <h3 className="font-bold text-sm mb-3">טווח תאריכים</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-soft mb-1">מתאריך</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">עד תאריך</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-2">ברירת מחדל: 6 חודשים קדימה</p>
        </Card>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-btn px-3 py-2">{error}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy
              ? (mode === "edit" ? "מעדכן..." : "יוצר שיעורים...")
              : (mode === "edit" ? "שמור שינויים" : "צור תבנית")}
          </Button>
          <Link
            href="/dashboard/lessons/recurring"
            className="inline-flex items-center h-10 px-4 rounded-btn border border-border bg-white text-sm font-medium text-ink-soft hover:text-ink hover:border-primary transition"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
