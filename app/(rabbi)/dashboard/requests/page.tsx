"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  CheckCircle,
  Send,
  Clock,
  LayoutGrid,
  TableProperties,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ContactReq = {
  id: string;
  studentName: string;
  message: string;
  reply: string | null;
  requestType: string | null;
  topic: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  status: string;
  createdAt: string;
  repliedAt: string | null;
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  SINGLE_LESSON: "שיעור בודד",
  STUDY_DAY: "יום עיון",
  SERIES: "סדרת שיעורים",
  WEDDING: "חופה / שבע ברכות",
  BRIT: "ברית מילה",
  BAR_MITZVAH: "בר/בת מצוה",
  SEFER_TORAH: "הכנסת ספר תורה",
  EVENT: "אירוע אחר",
  OTHER: "אחר",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: "ממתין", bg: "bg-gold/10", text: "text-gold", border: "border-gold/30" },
  APPROVED: { label: "אושר", bg: "bg-live/10", text: "text-live", border: "border-live/30" },
  REJECTED: { label: "נדחה", bg: "bg-danger/10", text: "text-danger", border: "border-danger/30" },
  REPLIED: { label: "נענה", bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
};

export default function RabbiRequestsPage() {
  const [requests, setRequests] = useState<ContactReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, startSending] = useTransition();
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/rabbi/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleReply(requestId: string) {
    if (replyText.trim().length === 0) return;
    setError("");
    startSending(async () => {
      try {
        const res = await fetch(`/api/rabbi/requests/${requestId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply: replyText.trim() }),
        });
        if (res.ok) {
          setReplyingId(null);
          setReplyText("");
          await fetchRequests();
        } else {
          const data = await res.json();
          setError(data.error || "שגיאה בשליחה");
        }
      } catch {
        setError("שגיאה בשליחה");
      }
    });
  }

  async function handleStatusChange(requestId: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/rabbi/requests/${requestId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchRequests();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "שגיאה בעדכון");
      }
    } catch {
      setError("שגיאה בעדכון");
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  }

  function formatShortDate(dateStr: string) {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
    }).format(new Date(dateStr));
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const others = requests.filter((r) => r.status !== "PENDING");

  if (loading) {
    return (
      <div className="text-center py-10 text-ink-muted">טוען פניות...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary" /> פניות תלמידים
        </h1>
        <div className="flex border border-border rounded-btn overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm transition",
              viewMode === "cards" ? "bg-primary text-white" : "bg-white text-ink-muted hover:bg-paper-soft"
            )}
            aria-label="תצוגת כרטיסים"
          >
            <LayoutGrid className="w-4 h-4" /> כרטיסים
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm transition",
              viewMode === "table" ? "bg-primary text-white" : "bg-white text-ink-muted hover:bg-paper-soft"
            )}
            aria-label="תצוגת טבלה"
          >
            <TableProperties className="w-4 h-4" /> טבלה
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 rounded-btn px-3 py-2">{error}</div>
      )}

      {/* ========== תצוגת טבלה ========== */}
      {viewMode === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-paper-soft text-ink-muted text-right">
                <th className="py-2 px-3 font-medium">תאריך פנייה</th>
                <th className="py-2 px-3 font-medium">תלמיד</th>
                <th className="py-2 px-3 font-medium">סוג</th>
                <th className="py-2 px-3 font-medium">נושא</th>
                <th className="py-2 px-3 font-medium">תאריך מבוקש</th>
                <th className="py-2 px-3 font-medium">שעה</th>
                <th className="py-2 px-3 font-medium">סטטוס</th>
                <th className="py-2 px-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-ink-muted">
                    אין פניות
                  </td>
                </tr>
              )}
              {requests.map((r) => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-paper-soft/50 transition">
                    <td className="py-2 px-3 text-xs text-ink-muted whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-2 px-3 font-medium text-ink">{r.studentName}</td>
                    <td className="py-2 px-3 text-ink-muted">
                      {r.requestType ? REQUEST_TYPE_LABELS[r.requestType] || r.requestType : "—"}
                    </td>
                    <td className="py-2 px-3 text-ink max-w-[200px] truncate" title={r.topic || ""}>
                      {r.topic || "—"}
                    </td>
                    <td className="py-2 px-3 text-ink-muted whitespace-nowrap">
                      {r.requestedDate ? formatShortDate(r.requestedDate) : "—"}
                    </td>
                    <td className="py-2 px-3 text-ink-muted">{r.requestedTime || "—"}</td>
                    <td className="py-2 px-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {r.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(r.id, "APPROVED")}
                            disabled={actionLoading === r.id}
                            className="text-xs bg-live/10 text-live hover:bg-live/20 px-2 py-1 rounded-btn transition disabled:opacity-50"
                            aria-label="אשר"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, "REJECTED")}
                            disabled={actionLoading === r.id}
                            className="text-xs bg-danger/10 text-danger hover:bg-danger/20 px-2 py-1 rounded-btn transition disabled:opacity-50"
                            aria-label="דחה"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setReplyingId(r.id); setReplyText(""); setError(""); }}
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-btn transition"
                            aria-label="השב"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== תצוגת כרטיסים ========== */}
      {viewMode === "cards" && (
        <div className="space-y-8">
          {/* ממתינות */}
          <section>
            <h2 className="hebrew-serif text-xl font-bold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" /> ממתינות ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <Card>
                <p className="text-ink-muted text-sm">אין פניות ממתינות</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <Card key={r.id} className="border-gold/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="font-medium text-ink">{r.studentName}</span>
                        <span className="text-xs text-ink-muted mr-2">{formatDate(r.createdAt)}</span>
                      </div>
                      <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">ממתין</span>
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
                          <span className="bg-paper-soft px-2 py-0.5 rounded-full font-medium text-ink">
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

                    <p className="text-sm text-ink-soft whitespace-pre-line mb-3">{r.message}</p>

                    {/* כפתורי פעולה */}
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(r.id, "APPROVED")}
                        disabled={actionLoading === r.id}
                        className="gap-1 bg-live hover:bg-live/90 text-white"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> אשר
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(r.id, "REJECTED")}
                        disabled={actionLoading === r.id}
                        className="gap-1 text-danger border-danger/30 hover:bg-danger/10"
                      >
                        <XCircle className="w-3.5 h-3.5" /> דחה
                      </Button>
                    </div>

                    {replyingId === r.id ? (
                      <div className="border-t border-border pt-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="כתוב תשובה..."
                          rows={3}
                          className="w-full rounded-btn border border-border bg-paper-soft p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {error && <p className="text-danger text-xs mt-1">{error}</p>}
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setReplyingId(null); setReplyText(""); setError(""); }}
                          >
                            ביטול
                          </Button>
                          <Button size="sm" onClick={() => handleReply(r.id)} disabled={sending}>
                            <Send className="w-4 h-4" />
                            {sending ? "שולח..." : "שלח תשובה"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setReplyingId(r.id); setReplyText(""); setError(""); }}
                      >
                        השב
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* נענו / אושר / נדחה */}
          <section>
            <h2 className="hebrew-serif text-xl font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-live" /> טופלו ({others.length})
            </h2>
            {others.length === 0 ? (
              <Card>
                <p className="text-ink-muted text-sm">אין פניות שטופלו</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {others.map((r) => {
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.REPLIED;
                  return (
                    <Card key={r.id} className={cn("border", sc.border)}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-medium text-ink">{r.studentName}</span>
                          <span className="text-xs text-ink-muted mr-2">{formatDate(r.createdAt)}</span>
                        </div>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                          {sc.label}
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
                            <span className="bg-paper-soft px-2 py-0.5 rounded-full font-medium text-ink">
                              {r.topic}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-ink-soft whitespace-pre-line mb-2">{r.message}</p>
                      {r.reply && (
                        <div className="border-t border-border pt-2 mt-2">
                          <span className="text-xs text-ink-muted">תשובה:</span>
                          <p className="text-sm text-ink whitespace-pre-line mt-1">{r.reply}</p>
                          {r.repliedAt && (
                            <span className="text-xs text-ink-muted">{formatDate(r.repliedAt)}</span>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* reply popup for table mode */}
      {viewMode === "table" && replyingId && (
        <Card className="mt-4">
          <h3 className="font-bold text-sm mb-2">תשובה לפנייה</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="כתוב תשובה..."
            rows={3}
            className="w-full rounded-btn border border-border bg-paper-soft p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-danger text-xs mt-1">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setReplyingId(null); setReplyText(""); setError(""); }}
            >
              ביטול
            </Button>
            <Button size="sm" onClick={() => handleReply(replyingId)} disabled={sending}>
              <Send className="w-4 h-4" />
              {sending ? "שולח..." : "שלח תשובה"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
