"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LANGUAGES, BROADCAST_TYPES } from "@/lib/enums";
import { broadcastIcon, ACCENT_BORDER, ACCENT_TEXT } from "@/components/BroadcastTypeBadge";

type Category = { id: string; name: string };

export function LessonForm({
  categories: initialCategories,
  initial,
  lessonId,
}: {
  categories: Category[];
  initial?: any;
  lessonId?: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    const res = await fetch("/api/me/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    setCreatingCategory(false);
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setForm((f) => ({ ...f, categoryId: cat.id }));
      setNewCategoryName("");
      setShowNewCategory(false);
    }
  }
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    categoryId: initial?.categoryId ?? "",
    scheduledAt: initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "",
    durationMin: initial?.durationMin ?? 60,
    language: initial?.language ?? "he",
    broadcastType: initial?.broadcastType ?? "LESSON",
    youtubeUrl: initial?.youtubeUrl ?? "",
    spotifyUrl: initial?.spotifyUrl ?? "",
    applePodcastUrl: initial?.applePodcastUrl ?? "",
    otherUrl: initial?.otherUrl ?? "",
    sourcesPdfUrl: initial?.sourcesPdfUrl ?? "",
    syncToCalendar: initial?.syncToCalendar ?? false,
    isLive: initial?.isLive ?? false,
    liveEmbedUrl: initial?.liveEmbedUrl ?? "",
    locationName: initial?.locationName ?? "",
    locationUrl: initial?.locationUrl ?? "",
    isRecurring: initial?.isRecurring ?? false,
    recurringFreq: "WEEKLY" as "DAILY" | "WEEKLY",
    recurringDay: new Date().getDay(),
    recurringHour: 20,
    recurringMinute: 0,
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const payload: any = {
      ...form,
      scheduledAt: form.isRecurring ? new Date().toISOString() : new Date(form.scheduledAt).toISOString(),
      categoryId: form.categoryId || null,
    };
    if (form.isRecurring) {
      payload.recurringRule = {
        freq: form.recurringFreq,
        dayOfWeek: form.recurringFreq === "WEEKLY" ? form.recurringDay : undefined,
        hour: form.recurringHour,
        minute: form.recurringMinute,
      };
    }
    const url = lessonId ? `/api/lessons/${lessonId}` : "/api/lessons";
    const res = await fetch(url, {
      method: lessonId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה בשמירה");
      return;
    }
    router.push("/dashboard/lessons");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <F label="כותרת">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
        </F>
        <F label="תיאור">
          <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input py-2 min-h-[6rem]" />
        </F>
        <F label="סוג שידור">
          <div
            role="radiogroup"
            aria-label="סוג שידור"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
          >
            {BROADCAST_TYPES.map((b) => {
              const selected = form.broadcastType === b.value;
              const Icon = broadcastIcon(b.icon);
              return (
                <button
                  key={b.value}
                  type="button"
                  role="radio"
                  aria-pressed={selected}
                  aria-checked={selected}
                  onClick={() => setForm({ ...form, broadcastType: b.value })}
                  className={`text-right rounded-card border p-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                    selected
                      ? `${ACCENT_BORDER[b.accent]} bg-paper-soft shadow-soft`
                      : "border-border bg-white hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-5 w-5 shrink-0 ${selected ? ACCENT_TEXT[b.accent] : "text-ink-muted"}`}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-ink text-sm">{b.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted leading-snug">
                    {b.description}
                  </p>
                </button>
              );
            })}
          </div>
        </F>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <F label="קטגוריה">
            {showNewCategory ? (
              <div className="flex gap-1">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createCategory())}
                  placeholder="שם חדש..."
                  className="input flex-1"
                  autoFocus
                />
                <button type="button" onClick={createCategory} disabled={creatingCategory} className="px-3 bg-primary text-white rounded-btn text-sm disabled:opacity-50">
                  ✓
                </button>
                <button type="button" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }} className="px-3 bg-paper-soft rounded-btn text-sm">✕</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input flex-1">
                  <option value="">— ללא —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewCategory(true)} className="px-3 bg-paper-soft border border-border rounded-btn text-sm hover:bg-primary-soft" title="הוסף קטגוריה חדשה">
                  +
                </button>
              </div>
            )}
            {categories.length === 0 && !showNewCategory && (
              <p className="text-xs text-ink-muted mt-1">אין עדיין קטגוריות. לחץ + ליצירה מהירה.</p>
            )}
          </F>
          <F label="שפת השיעור">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="input"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </F>
          <F label="משך (דקות)">
            <input type="number" min={1} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className="input" />
          </F>
        </div>
        {/* מחזוריות — רק ביצירה חדשה */}
        {!lessonId && (
          <div className={`rounded-card border p-4 transition ${form.isRecurring ? "border-gold bg-gold-soft/30" : "border-border"}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="w-5 h-5 accent-gold"
              />
              <div>
                <span className="font-semibold text-ink">שיעור מחזורי קבוע</span>
                <span className="text-xs text-ink-muted mr-2">— ייצור 12 מופעים אוטומטית</span>
              </div>
            </label>
            {form.isRecurring && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <F label="תדירות">
                  <select value={form.recurringFreq} onChange={(e) => setForm({ ...form, recurringFreq: e.target.value as any })} className="input">
                    <option value="WEEKLY">שבועי</option>
                    <option value="DAILY">יומי</option>
                  </select>
                </F>
                {form.recurringFreq === "WEEKLY" && (
                  <F label="יום">
                    <select value={form.recurringDay} onChange={(e) => setForm({ ...form, recurringDay: Number(e.target.value) })} className="input">
                      {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </F>
                )}
                <F label="שעה">
                  <input type="number" min={0} max={23} value={form.recurringHour} onChange={(e) => setForm({ ...form, recurringHour: Number(e.target.value) })} className="input" />
                </F>
                <F label="דקה">
                  <input type="number" min={0} max={59} step={5} value={form.recurringMinute} onChange={(e) => setForm({ ...form, recurringMinute: Number(e.target.value) })} className="input" />
                </F>
              </div>
            )}
          </div>
        )}
        {!form.isRecurring && (
          <F label="תאריך ושעה">
            <input type="datetime-local" required={!form.isRecurring} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input" />
          </F>
        )}

        {/* מיקום פיזי (אופציונלי) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="מיקום פיזי (אופציונלי)">
            <input
              type="text"
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
              className="input"
              placeholder="לדוגמה: ביה״כ אור החיים, רחוב..."
            />
          </F>
          <F label="קישור ל-Google Maps (אופציונלי)">
            <input
              type="url"
              value={form.locationUrl}
              onChange={(e) => setForm({ ...form, locationUrl: e.target.value })}
              className="input" dir="ltr"
              placeholder="https://maps.google.com/..."
            />
          </F>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <F label="YouTube"><input type="url" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} className="input" dir="ltr" /></F>
          <F label="Spotify"><input type="url" value={form.spotifyUrl} onChange={(e) => setForm({ ...form, spotifyUrl: e.target.value })} className="input" dir="ltr" /></F>
          <F label="Apple Podcasts"><input type="url" value={form.applePodcastUrl} onChange={(e) => setForm({ ...form, applePodcastUrl: e.target.value })} className="input" dir="ltr" /></F>
          <F label="קישור נוסף"><input type="url" value={form.otherUrl} onChange={(e) => setForm({ ...form, otherUrl: e.target.value })} className="input" dir="ltr" /></F>
        </div>
        <F label="קישור ל-PDF מקורות">
          <input type="url" value={form.sourcesPdfUrl} onChange={(e) => setForm({ ...form, sourcesPdfUrl: e.target.value })} className="input" dir="ltr" />
        </F>
        {/* שידור חי */}
        <div className={`rounded-card border p-4 transition ${form.isLive ? "border-live bg-live/5" : "border-border"}`}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isLive}
              onChange={(e) => setForm({ ...form, isLive: e.target.checked })}
              className="w-5 h-5 accent-live"
            />
            <div>
              <span className="font-semibold text-ink">שידור חי</span>
              <span className="text-xs text-ink-muted mr-2">— סמן אם השיעור משודר עכשיו</span>
            </div>
          </label>
          {form.isLive && (
            <div className="mt-3">
              <F label="קישור לשידור (YouTube / Zoom / אחר)">
                <input
                  type="url"
                  value={form.liveEmbedUrl}
                  onChange={(e) => setForm({ ...form, liveEmbedUrl: e.target.value })}
                  className="input" dir="ltr"
                  placeholder="https://youtube.com/live/..."
                />
              </F>
              <p className="text-xs text-ink-muted mt-1">הלינק יוצג כ-embed בדף השיעור. הצופים יוכלו לצפות ישירות מהאתר.</p>
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.syncToCalendar} onChange={(e) => setForm({ ...form, syncToCalendar: e.target.checked })} />
          סנכרן ליומן (כשמחובר)
        </label>
        {err && <div className="text-sm text-danger">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "שומר..." : lessonId ? "שמור שינויים" : "צור שיעור"}
        </Button>
      </form>
      <style jsx>{`.input { width: 100%; height: 2.75rem; padding: 0 .75rem; border-radius: 10px; border: 1px solid #E5E7EB; background: white; }`}</style>
    </Card>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
