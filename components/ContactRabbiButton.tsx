"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Send, X, BookOpen, MessageCircle, Calendar, Clock, MapPin, User, Phone, Mail } from "lucide-react";
import Link from "next/link";

interface ContactRabbiButtonProps {
  rabbiId: string;
  canSend: boolean;
  isBlocked: boolean;
  /** פרטי המשתמש המחובר — מוצגים לאישור (כדי שידע שהרב יכול ליצור איתו קשר) */
  userInfo?: { email?: string; phone?: string; name?: string };
}

const REQUEST_TYPES: { value: string; label: string }[] = [
  { value: "SINGLE_LESSON", label: "שיעור חד-פעמי" },
  { value: "SERIES", label: "סדרת שיעורים" },
  { value: "STUDY_DAY", label: "יום עיון" },
  { value: "WEDDING", label: "חתונה" },
  { value: "BAR_MITZVAH", label: "בר מצווה" },
  { value: "BRIT", label: "ברית" },
  { value: "SEFER_TORAH", label: "הכנסת ספר תורה" },
  { value: "EVENT", label: "אירוע אחר" },
  { value: "OTHER", label: "אחר" },
];

/** המרת תאריך גרגוריאני לעברי (לתצוגה) */
function gregorianToHebrew(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      day: "numeric", month: "long", year: "numeric", weekday: "long",
    }).format(d);
  } catch { return ""; }
}

export function ContactRabbiButton({ rabbiId, canSend, isBlocked, userInfo }: ContactRabbiButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"event" | "general">("general");
  const [sending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Common fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  // Event request fields
  const [requestType, setRequestType] = useState("SINGLE_LESSON");
  const [topic, setTopic] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("20:00");
  const [locationName, setLocationName] = useState("");

  const hebrewDate = useMemo(() => gregorianToHebrew(requestedDate), [requestedDate]);

  if (isBlocked) {
    return (
      <span className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-danger/20 bg-danger/5 text-danger text-sm">
        <MessageSquare className="w-4 h-4" /> אינך מורשה לשלוח הודעות
      </span>
    );
  }

  if (!canSend) {
    return (
      <Link
        href="/login"
        className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-border bg-white text-ink-soft text-sm"
      >
        <MessageSquare className="w-4 h-4" /> התחבר כדי לפנות לרב
      </Link>
    );
  }

  function reset() {
    setTitle("");
    setMessage("");
    setTopic("");
    setRequestedDate("");
    setRequestedTime("20:00");
    setLocationName("");
    setRequestType("SINGLE_LESSON");
    setError("");
  }

  function close() {
    setOpen(false);
    setSuccess(false);
    reset();
  }

  function handleSend() {
    setError("");

    // Validation per mode
    if (mode === "event") {
      if (!topic.trim()) return setError("חסר נושא השיעור");
      if (!requestedDate) return setError("חסר תאריך מבוקש");
      if (message.trim().length < 10) return setError("פירוט חייב לפחות 10 תווים");
    } else {
      if (!title.trim()) return setError("חסר נושא הפנייה");
      if (message.trim().length < 10) return setError("פירוט חייב לפחות 10 תווים");
    }

    startTransition(async () => {
      try {
        // בונים הודעה מובנית הכוללת את כל השדות
        let composedMessage = "";
        if (mode === "event") {
          composedMessage = [
            `🗂️ סוג בקשה: ${REQUEST_TYPES.find((r) => r.value === requestType)?.label ?? requestType}`,
            `📚 נושא: ${topic}`,
            `📅 תאריך מבוקש: ${hebrewDate || requestedDate} (${requestedDate})`,
            `🕐 שעה: ${requestedTime}`,
            locationName ? `📍 מיקום: ${locationName}` : "",
            "",
            `📝 פירוט:`,
            message,
            "",
            userInfo ? `✉️ ליצירת קשר: ${userInfo.email ?? "—"} ${userInfo.phone ? `· 📱 ${userInfo.phone}` : ""}` : "",
          ].filter(Boolean).join("\n");
        } else {
          composedMessage = [
            `📌 נושא: ${title}`,
            "",
            message,
            "",
            userInfo ? `✉️ ליצירת קשר: ${userInfo.email ?? "—"} ${userInfo.phone ? `· 📱 ${userInfo.phone}` : ""}` : "",
          ].filter(Boolean).join("\n");
        }

        const res = await fetch(`/api/rabbi/${rabbiId}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: composedMessage,
            requestType: mode === "event" ? requestType : "OTHER",
            topic: mode === "event" ? topic : title,
            requestedDate: mode === "event" && requestedDate ? new Date(requestedDate).toISOString() : undefined,
            requestedTime: mode === "event" ? requestedTime : undefined,
          }),
        });
        if (res.ok) {
          setSuccess(true);
          setTimeout(close, 2500);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "שגיאה בשליחה");
        }
      } catch {
        setError("שגיאה בשליחה");
      }
    });
  }

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4" />
        פנייה לרב
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white w-full sm:max-w-lg sm:rounded-card rounded-t-card shadow-card max-h-[95vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <h2 className="hebrew-serif text-xl font-bold text-ink">פנייה לרב</h2>
              <button onClick={close} className="text-ink-muted hover:text-ink p-1" aria-label="סגור">
                <X className="w-5 h-5" />
              </button>
            </header>

            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-live/10 flex items-center justify-center">
                  <Send className="w-8 h-8 text-live" />
                </div>
                <h3 className="font-bold text-ink mb-1">הפנייה נשלחה!</h3>
                <p className="text-sm text-ink-soft">הרב יקבל את פנייתך ויחזור אליך בהקדם.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Mode tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-paper-soft rounded-btn">
                  <button
                    type="button"
                    onClick={() => { setMode("general"); setError(""); }}
                    className={`h-11 rounded-btn flex items-center justify-center gap-2 text-sm font-medium transition ${
                      mode === "general" ? "bg-white text-primary shadow-sm" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    פנייה כללית
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("event"); setError(""); }}
                    className={`h-11 rounded-btn flex items-center justify-center gap-2 text-sm font-medium transition ${
                      mode === "event" ? "bg-white text-primary shadow-sm" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    בקשה לשיעור / אירוע
                  </button>
                </div>

                {mode === "event" ? (
                  <>
                    <Field label="סוג הבקשה" icon={BookOpen}>
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value)}
                        className="input"
                      >
                        {REQUEST_TYPES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="נושא השיעור / האירוע" icon={BookOpen}>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="לדוגמה: שיעור על פרשת השבוע, ברכת חתנים, דרשה לבר מצווה..."
                        className="input"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="תאריך" icon={Calendar}>
                        <input
                          type="date"
                          value={requestedDate}
                          onChange={(e) => setRequestedDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="input"
                          dir="ltr"
                        />
                      </Field>
                      <Field label="שעה" icon={Clock}>
                        <input
                          type="time"
                          value={requestedTime}
                          onChange={(e) => setRequestedTime(e.target.value)}
                          className="input"
                          dir="ltr"
                        />
                      </Field>
                    </div>

                    {hebrewDate && (
                      <div className="text-sm bg-gold-soft border border-gold/30 rounded-btn px-3 py-2 text-gold">
                        📅 בלוח עברי: <strong>{hebrewDate}</strong>
                      </div>
                    )}

                    <Field label="מיקום (אופציונלי)" icon={MapPin}>
                      <input
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="שם בית כנסת, אולם, יישוב..."
                        className="input"
                      />
                    </Field>

                    <Field label="פירוט נוסף">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="פרטים נוספים — קהל יעד, אורך משוער, רקע..."
                        rows={3}
                        className="input"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="נושא הפנייה" icon={MessageCircle}>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="לדוגמה: שאלה על הלכה, בירור על שיעור..."
                        className="input"
                      />
                    </Field>

                    <Field label="פירוט">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="כתוב את שאלתך / פנייתך בפירוט..."
                        rows={5}
                        className="input"
                      />
                    </Field>
                  </>
                )}

                {/* User contact info — readonly, so user knows what rabbi will see */}
                {userInfo && (
                  <div className="rounded-btn border border-border bg-paper-soft p-3">
                    <div className="text-xs text-ink-muted mb-1.5">📞 הרב יראה את פרטיך כדי לחזור אליך:</div>
                    <div className="text-sm text-ink-soft space-y-1">
                      {userInfo.name && <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> {userInfo.name}</div>}
                      {userInfo.email && <div className="flex items-center gap-1.5" dir="ltr"><Mail className="w-3 h-3" /> {userInfo.email}</div>}
                      {userInfo.phone ? (
                        <div className="flex items-center gap-1.5" dir="ltr"><Phone className="w-3 h-3" /> {userInfo.phone}</div>
                      ) : (
                        <div className="text-xs text-ink-muted">
                          <Link href="/my/profile" className="text-primary hover:underline">הוסף טלפון</Link> כדי לאפשר לרב להתקשר
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-btn px-3 py-2">{error}</div>}

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="md" onClick={close} disabled={sending} className="flex-1">
                    ביטול
                  </Button>
                  <Button variant="primary" size="md" onClick={handleSend} disabled={sending} className="flex-1">
                    <Send className="w-4 h-4" />
                    {sending ? "שולח..." : "שלח"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          height: 2.75rem;
          padding: 0 .75rem;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          background: white;
          font-size: 0.9rem;
        }
        textarea.input { height: auto; padding: .75rem; }
        .input:focus { outline: none; border-color: #1E40AF; box-shadow: 0 0 0 3px rgba(30,64,175,0.1); }
      `}</style>
    </>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      {children}
    </label>
  );
}
