"use client";

import { useEffect, useState, useTransition } from "react";
import { MessageSquare, Trash2, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatHebrewDate } from "@/lib/utils";
import { RABBI_MESSAGE_MAX } from "@/lib/rabbi-message";

type RMessage = {
  id: string;
  content: string;
  published: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export default function DashboardMessagesPage() {
  const [messages, setMessages] = useState<RMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [sending, startSending] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/rabbi/messages", { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("ההודעה קצרה מדי");
      return;
    }
    if (trimmed.length > RABBI_MESSAGE_MAX) {
      setError(`ההודעה ארוכה מדי (מקסימום ${RABBI_MESSAGE_MAX} תווים)`);
      return;
    }
    startSending(async () => {
      const r = await fetch("/api/rabbi/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          expiresAt: expiresAt || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j?.error ?? "שגיאה בשליחה");
        return;
      }
      setContent("");
      setExpiresAt("");
      await load();
    });
  }

  async function remove(id: string) {
    if (!confirm("למחוק את ההודעה?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/rabbi/messages/${id}`, { method: "DELETE" });
      if (r.ok) {
        setMessages((m) => m.filter((x) => x.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const remaining = RABBI_MESSAGE_MAX - content.length;
  const tooLong = remaining < 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="hebrew-serif text-3xl font-bold text-ink flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary" />
          הודעות לתלמידים
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          הודעות קצרות שמופיעות בעמוד שלך כסליידר. עד {RABBI_MESSAGE_MAX} תווים
          להודעה.
        </p>
      </header>

      <Card className="mb-8">
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-ink mb-1.5">
              ההודעה
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={RABBI_MESSAGE_MAX + 50}
              placeholder="כתוב הודעה קצרה לתלמידים — מחשבה לפרשה, ברכה, עדכון..."
              className="w-full px-3 py-2 rounded-btn border border-border bg-white text-base focus:border-primary focus:outline-none resize-y"
              aria-describedby="msg-count"
            />
            <div
              id="msg-count"
              className={
                "text-xs mt-1 " +
                (tooLong ? "text-danger" : "text-ink-muted")
              }
            >
              {remaining} תווים נותרו
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-ink mb-1.5">
              תפוגה (אופציונלי)
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-3 h-10 rounded-btn border border-border bg-white text-base focus:border-primary focus:outline-none"
            />
          </label>

          {error && (
            <div className="text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || tooLong || content.trim().length < 2}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            פרסם הודעה
          </button>
        </form>
      </Card>

      <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">
        הודעות שפורסמו ({messages.length})
      </h2>

      {loading ? (
        <Card>
          <div className="text-ink-muted text-sm">טוען...</div>
        </Card>
      ) : messages.length === 0 ? (
        <Card>
          <div className="text-ink-muted text-sm">
            עדיין לא פרסמת הודעות. ההודעות שתפרסם יופיעו בראש דף הרב שלך.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-ink whitespace-pre-line break-words">
                    {m.content}
                  </p>
                  <div className="mt-2 text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                    <span>{formatHebrewDate(new Date(m.createdAt))}</span>
                    {m.expiresAt && (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          תפוגה: {formatHebrewDate(new Date(m.expiresAt))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  disabled={deletingId === m.id}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-btn border border-border text-ink-muted hover:border-danger hover:text-danger transition disabled:opacity-50"
                  aria-label="מחק הודעה"
                >
                  {deletingId === m.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
