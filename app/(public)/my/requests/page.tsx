"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Plus,
  Send,
  XCircle,
  ThumbsUp,
} from "lucide-react";
import { formatHebrewDateLetters, formatHebrewDateWithWeekday } from "@/lib/utils";
import { HebrewDatePicker } from "@/components/HebrewDatePicker";

type MyRequest = {
  id: string;
  rabbiName: string;
  rabbiSlug: string;
  message: string;
  reply: string | null;
  requestType: string | null;
  topic: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  status: string;
  approvedLessonId: string | null;
  approvedLessonIsPublic: boolean | null;
  approvedLessonScheduledAt: string | null;
  createdAt: string;
  repliedAt: string | null;
};

type FollowedRabbi = {
  id: string;
  name: string;
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  SINGLE_LESSON: "שיעור בודד",
  STUDY_DAY: "חלק מיום עיון",
  SERIES: "סדרת שיעורים",
  WEDDING: "חופה / שבע ברכות",
  BRIT: "ברית מילה",
  BAR_MITZVAH: "בר/בת מצוה",
  SEFER_TORAH: "הכנסת ספר תורה",
  EVENT: "אירוע אחר",
  OTHER: "אחר",
};

const REQUEST_TYPE_OPTIONS = [
  "SINGLE_LESSON",
  "STUDY_DAY",
  "SERIES",
  "WEDDING",
  "BRIT",
  "BAR_MITZVAH",
  "SEFER_TORAH",
  "EVENT",
  "OTHER",
] as const;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: { label: "ממתין", bg: "bg-gold/10", text: "text-gold", icon: <Clock className="w-3 h-3" /> },
  APPROVED: { label: "אושר", bg: "bg-live/10", text: "text-live", icon: <ThumbsUp className="w-3 h-3" /> },
  REJECTED: { label: "נדחה", bg: "bg-danger/10", text: "text-danger", icon: <XCircle className="w-3 h-3" /> },
  REPLIED: { label: "נענה", bg: "bg-primary/10", text: "text-primary", icon: <CheckCircle className="w-3 h-3" /> },
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [followedRabbis, setFollowedRabbis] = useState<FollowedRabbi[]>([]);
  const [selectedRabbi, setSelectedRabbi] = useState("");
  const [requestType, setRequestType] = useState("SINGLE_LESSON");
  const [topic, setTopic] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [message, setMessage] = useState("");
  const [preferredVisibility, setPreferredVisibility] = useState<"public" | "private" | "any">("any");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me/requests");
        if (res.ok) setRequests(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openForm() {
    setShowForm(true);
    setSendError(null);
    setSendOk(false);
    try {
      const res = await fetch("/api/me/following-rabbis");
      if (res.ok) setFollowedRabbis(await res.json());
    } catch {
      // silent
    }
  }

  function resetForm() {
    setSelectedRabbi("");
    setRequestType("SINGLE_LESSON");
    setTopic("");
    setRequestedDate("");
    setRequestedTime("");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRabbi || !topic.trim()) return;
    setSending(true);
    setSendError(null);
    setSendOk(false);

    try {
      // העדפת ציבורי/פרטי נשמרת כתוספת להודעה (הרב יראה בפנייה)
      const visibilityNote =
        preferredVisibility === "public"
          ? "\n\n[העדפת התלמיד: שיעור ציבורי — שיופיע בלוח השיעורים של האתר.]"
          : preferredVisibility === "private"
          ? "\n\n[העדפת התלמיד: אירוע פרטי — לא לפרסם בלוח הציבורי.]"
          : "";
      const fullMessage = (message || topic) + visibilityNote;

      const res = await fetch(`/api/rabbi/${selectedRabbi}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullMessage,
          requestType,
          topic,
          requestedDate: requestedDate || undefined,
          requestedTime: requestedTime || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSendError(j.error || "שגיאה בשליחה");
        return;
      }
      setSendOk(true);
      resetForm();
      // רענן רשימת פניות
      const refreshRes = await fetch("/api/me/requests");
      if (refreshRes.ok) setRequests(await refreshRes.json());
      setTimeout(() => {
        setShowForm(false);
        setSendOk(false);
      }, 2000);
    } catch {
      setSendError("שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const hebrew = formatHebrewDateLetters(d, true);
    const time = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${hebrew} · ${time}`;
  }

  function formatShortDate(dateStr: string) {
    return formatHebrewDateLetters(new Date(dateStr), false);
  }

  if (loading) {
    return <div className="text-center py-10 text-ink-muted">טוען פניות...</div>;
  }

  const inputCls = "w-full h-11 px-3 rounded-btn border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="hebrew-serif text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" /> הפניות שלי
        </h1>
        {!showForm && (
          <Button size="sm" onClick={openForm} className="gap-1.5">
            <Plus className="w-4 h-4" /> בקשת שיעור
          </Button>
        )}
      </div>

      {/* טופס בקשת שיעור מפורט */}
      {showForm && (
        <Card className="mb-6">
          <h3 className="font-bold text-sm mb-4">בקשת שיעור חדשה</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* בחירת רב */}
            <div>
              <label className="block text-sm text-ink-soft mb-1">בחר רב *</label>
              <select
                value={selectedRabbi}
                onChange={(e) => setSelectedRabbi(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">בחר רב מהרבנים שאני עוקב...</option>
                {followedRabbis.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {followedRabbis.length === 0 && (
                <p className="text-xs text-ink-muted mt-1">
                  עדיין לא עוקב אחרי אף רב.{" "}
                  <Link href="/my/rabbis" className="text-primary hover:underline">גלה רבנים</Link>
                </p>
              )}
            </div>

            {/* סוג בקשה */}
            <div>
              <label className="block text-sm text-ink-soft mb-2">סוג בקשה</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REQUEST_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-1.5 text-sm cursor-pointer border rounded-btn px-2 py-1.5 transition ${
                      requestType === type
                        ? "border-primary bg-primary-soft/40 text-primary font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value={type}
                      checked={requestType === type}
                      onChange={() => setRequestType(type)}
                      className="accent-primary"
                    />
                    {REQUEST_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            </div>

            {/* נושא */}
            <div>
              <label className="block text-sm text-ink-soft mb-1">נושא *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="הנושא המבוקש לשיעור"
                className={inputCls}
              />
            </div>

            {/* תאריך ושעה */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-ink-soft mb-1">תאריך מבוקש</label>
                <HebrewDatePicker
                  value={requestedDate}
                  onChange={setRequestedDate}
                  minDate={new Date().toISOString().slice(0, 10)}
                  placeholder="בחר תאריך מבוקש"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-soft mb-1">שעה מבוקשת</label>
                <input
                  type="time"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* העדפת ציבורי/פרטי */}
            <div>
              <label className="block text-sm text-ink-soft mb-2">העדפה: סוג השיעור</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: "any" as const, label: "לפי החלטת הרב", icon: "🤷‍♂️", desc: "הרב יחליט" },
                  { value: "public" as const, label: "🌍 ציבורי", icon: "", desc: "פתוח לכל הקהל" },
                  { value: "private" as const, label: "🔒 פרטי", icon: "", desc: "אירוע משפחתי/אישי" },
                ].map((opt) => (
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
                      {opt.icon} {opt.label}
                    </span>
                    <span className="text-xs text-ink-muted mr-5">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* הערות */}
            <div>
              <label className="block text-sm text-ink-soft mb-1">הערות</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="הערות נוספות (אופציונלי)"
                className="w-full px-3 py-2 rounded-btn border border-border bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {sendError && <div className="text-sm text-danger">{sendError}</div>}
            {sendOk && <div className="text-sm text-live">הבקשה נשלחה בהצלחה!</div>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={sending} className="gap-1.5">
                <Send className="w-3.5 h-3.5" /> {sending ? "שולח..." : "שלח בקשה"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-sm">עדיין לא שלחת פניות לרבנים.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
            return (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <Link
                      href={`/rabbi/${r.rabbiSlug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.rabbiName}
                    </Link>
                    <span className="text-xs text-ink-muted mr-2">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <span className={`text-xs ${sc.bg} ${sc.text} px-2 py-0.5 rounded-full flex items-center gap-1`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* פרטי בקשה */}
                {(r.requestType || r.topic) && (
                  <div className="flex flex-wrap gap-2 text-xs text-ink-muted mb-2">
                    {r.requestType && (
                      <span className="bg-paper-soft px-2 py-0.5 rounded-full">
                        {REQUEST_TYPE_LABELS[r.requestType] || r.requestType}
                      </span>
                    )}
                    {r.topic && (
                      <span className="bg-paper-soft px-2 py-0.5 rounded-full">
                        {r.topic}
                      </span>
                    )}
                    {r.requestedDate && (
                      <span className="bg-paper-soft px-2 py-0.5 rounded-full">
                        {formatShortDate(r.requestedDate)}
                      </span>
                    )}
                    {r.requestedTime && (
                      <span className="bg-paper-soft px-2 py-0.5 rounded-full">
                        {r.requestedTime}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm text-ink-soft whitespace-pre-line">{r.message}</p>

                {r.reply && (
                  <div className="border-t border-border pt-3 mt-3">
                    <span className="text-xs text-ink-muted">תשובת הרב:</span>
                    <p className="text-sm text-ink whitespace-pre-line mt-1">{r.reply}</p>
                    {r.repliedAt && (
                      <span className="text-xs text-ink-muted">{formatDate(r.repliedAt)}</span>
                    )}
                  </div>
                )}

                {/* כשהבקשה אושרה ויש שיעור — מידע מלא + קישור */}
                {r.status === "APPROVED" && r.approvedLessonId && (
                  <div className="border-t border-border pt-3 mt-3 space-y-2">
                    {/* באנר ציבורי/פרטי */}
                    {r.approvedLessonIsPublic !== null && (
                      <div className={`text-xs px-3 py-2 rounded-btn border ${
                        r.approvedLessonIsPublic
                          ? "bg-live/10 border-live/30 text-ink"
                          : "bg-paper-warm border-gold/30 text-ink"
                      }`}>
                        {r.approvedLessonIsPublic ? (
                          <>
                            🌍 <strong>השיעור ציבורי</strong> — מופיע בלוח השיעורים של האתר. כל אחד יכול להצטרף.
                          </>
                        ) : (
                          <>
                            🔒 <strong>אירוע פרטי</strong> — לא מופיע בלוח הציבורי. תקבל הזמנה אישית קרוב לתאריך.
                          </>
                        )}
                      </div>
                    )}

                    {/* תאריך השיעור */}
                    {r.approvedLessonScheduledAt && (
                      <p className="text-sm text-ink-soft">
                        📅 <strong>{formatDate(r.approvedLessonScheduledAt)}</strong>
                      </p>
                    )}

                    <Link
                      href={`/lesson/${r.approvedLessonId}`}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-live text-white text-sm font-semibold hover:bg-live/90 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      לדף השיעור ←
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
