"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2, Globe, Lock } from "lucide-react";
import { formatHebrewDateWithWeekday } from "@/lib/utils";
import { HebrewDatePicker } from "@/components/HebrewDatePicker";

const REQUEST_TYPES = [
  { value: "SINGLE_LESSON", label: "שיעור בודד" },
  { value: "STUDY_DAY", label: "חלק מיום עיון" },
  { value: "SERIES", label: "סדרת שיעורים" },
  { value: "WEDDING", label: "חופה / שבע ברכות" },
  { value: "BRIT", label: "ברית מילה" },
  { value: "BAR_MITZVAH", label: "בר/בת מצוה" },
  { value: "SEFER_TORAH", label: "הכנסת ספר תורה" },
  { value: "EVENT", label: "אירוע אחר" },
  { value: "OTHER", label: "אחר / שאלה" },
];

export function AskRabbiForm({
  rabbiId,
  rabbiName,
  userInfo,
}: {
  rabbiId: string;
  rabbiName: string;
  userInfo: { name: string; email?: string; phone?: string };
}) {
  const router = useRouter();
  const [requestType, setRequestType] = useState("SINGLE_LESSON");
  const [topic, setTopic] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [message, setMessage] = useState("");
  const [preferredVisibility, setPreferredVisibility] = useState<"public" | "private" | "any">("any");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // תצוגת תאריך עברי באותיות
  const hebrewDatePreview = requestedDate
    ? formatHebrewDateWithWeekday(new Date(requestedDate), true)
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setError("יש להזין נושא לפנייה");
      return;
    }
    setError(null);
    setBusy(true);

    const visibilityNote =
      preferredVisibility === "public"
        ? "\n\n[העדפת התלמיד: שיעור ציבורי — שיופיע בלוח השיעורים של האתר.]"
        : preferredVisibility === "private"
        ? "\n\n[העדפת התלמיד: אירוע פרטי — לא לפרסם בלוח הציבורי.]"
        : "";

    try {
      const res = await fetch(`/api/rabbi/${rabbiId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: (message || topic) + visibilityNote,
          requestType,
          topic,
          requestedDate: requestedDate || undefined,
          requestedTime: requestedTime || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "שגיאה בשליחה");
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className="border-live/40 bg-live/5">
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-live/15 mb-3">
            <CheckCircle2 className="w-8 h-8 text-live" />
          </div>
          <h3 className="hebrew-serif text-2xl font-bold text-ink mb-2">הפנייה נשלחה בהצלחה</h3>
          <p className="text-sm text-ink-soft mb-6 max-w-md mx-auto">
            <strong>{rabbiName}</strong> יקבל את הפנייה ויחזור אליך. תוכל לעקוב אחרי הסטטוס בעמוד "הפניות שלי".
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/my/requests"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
            >
              לפניות שלי
            </Link>
            <Link
              href="/ask-rabbi"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-white text-ink-soft font-medium hover:text-ink hover:border-primary transition"
            >
              לפנייה לרב נוסף
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const inputCls = "w-full h-11 px-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* סוג בקשה */}
      <Card>
        <label className="block text-sm font-semibold text-ink mb-2">סוג הפנייה</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REQUEST_TYPES.map((t) => (
            <label
              key={t.value}
              className={`flex items-center gap-1.5 text-sm cursor-pointer border rounded-btn px-2 py-1.5 transition ${
                requestType === t.value
                  ? "border-primary bg-primary-soft/40 text-primary font-medium"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="requestType"
                value={t.value}
                checked={requestType === t.value}
                onChange={() => setRequestType(t.value)}
                className="accent-primary"
              />
              {t.label}
            </label>
          ))}
        </div>
      </Card>

      {/* נושא */}
      <Card>
        <label htmlFor="topic" className="block text-sm font-semibold text-ink mb-1">
          נושא <span className="text-danger">*</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          placeholder="לדוגמה: שיעור בהלכות שבת לבני ישיבת התיכון"
          className={inputCls}
        />
      </Card>

      {/* תאריך ושעה */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">תאריך מבוקש</label>
            <HebrewDatePicker
              value={requestedDate}
              onChange={setRequestedDate}
              minDate={new Date().toISOString().slice(0, 10)}
              placeholder="בחר תאריך מבוקש"
            />
          </div>
          <div>
            <label htmlFor="reqTime" className="block text-sm font-semibold text-ink mb-1">שעה מבוקשת</label>
            <input
              id="reqTime"
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </Card>

      {/* ציבורי / פרטי */}
      <Card>
        <label className="block text-sm font-semibold text-ink mb-2">העדפה: סוג השיעור</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { value: "any" as const, label: "לפי החלטת הרב", icon: null, desc: "הרב יחליט מה מתאים" },
            { value: "public" as const, label: "ציבורי", icon: Globe, desc: "פתוח לכל הקהל" },
            { value: "private" as const, label: "פרטי", icon: Lock, desc: "אירוע משפחתי/אישי" },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.value}
                className={`flex flex-col items-start gap-0.5 cursor-pointer border rounded-btn px-3 py-2 transition ${
                  preferredVisibility === opt.value
                    ? "border-primary bg-primary-soft/40 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="preferredVisibility"
                    value={opt.value}
                    checked={preferredVisibility === opt.value}
                    onChange={() => setPreferredVisibility(opt.value)}
                    className="accent-primary"
                  />
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {opt.label}
                </span>
                <span className="text-xs text-ink-muted mr-5">{opt.desc}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* הערות */}
      <Card>
        <label htmlFor="message" className="block text-sm font-semibold text-ink mb-1">
          הערות נוספות
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="פרטים נוספים שיעזרו לרב להבין את הבקשה (אופציונלי)"
          className="w-full px-3 py-2 rounded-btn border border-border bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </Card>

      {/* פרטי קשר נשלחים אוטומטית */}
      <div className="text-xs text-ink-muted border border-dashed border-border rounded-btn p-3">
        💌 פרטי הקשר שלך ישלחו לרב יחד עם הפנייה: <strong>{userInfo.name}</strong>
        {userInfo.email && <> · <span dir="ltr">{userInfo.email}</span></>}
        {userInfo.phone && <> · {userInfo.phone}</>}
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-btn px-3 py-2">{error}</div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1 sm:flex-none">
          <Send className="w-4 h-4" />
          {busy ? "שולח..." : "שלח פנייה"}
        </Button>
        <Link
          href="/ask-rabbi"
          className="inline-flex items-center h-10 px-4 rounded-btn border border-border bg-white text-sm font-medium text-ink-soft hover:text-ink hover:border-primary transition"
        >
          ביטול
        </Link>
      </div>
    </form>
  );
}
