"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageSquare, CheckCircle, Send } from "lucide-react";
import Link from "next/link";

type ChatMsg = {
  id: string;
  content: string;
  studentName: string;
  isAnswered: boolean;
  createdAt: string;
};

interface LessonChatProps {
  lessonId: string;
  canSend: boolean;
  isBlocked: boolean;
}

export function LessonChat({ lessonId, canSend, isBlocked }: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/chat`);
      if (res.ok) {
        const data: ChatMsg[] = await res.json();
        setMessages(data);
      }
    } catch {
      // silent polling failure
    }
  }, [lessonId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSend() {
    if (!content.trim() || content.length < 2) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        await fetchMessages();
      } else {
        const data = await res.json();
        setError(data.error || "שגיאה בשליחה");
      }
    } catch {
      setError("שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(d);
  }

  return (
    <Card className="mt-8">
      <h2 className="hebrew-serif text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        שאלות ותגובות
      </h2>

      {/* רשימת הודעות */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-ink-muted text-sm">עדיין אין שאלות. היה הראשון לשאול!</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="border border-border rounded-card p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink">{msg.studentName}</span>
              <div className="flex items-center gap-2">
                {msg.isAnswered && (
                  <span className="inline-flex items-center gap-1 text-xs text-live bg-live/10 rounded-full px-2 py-0.5">
                    <CheckCircle className="w-3 h-3" /> נענה
                  </span>
                )}
                <span className="text-xs text-ink-muted">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
            <p className="text-sm text-ink-soft whitespace-pre-line">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* שדה שליחה */}
      {canSend && !isBlocked && (
        <div className="border-t border-border pt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="כתוב שאלה..."
            maxLength={1000}
            rows={2}
            className="w-full rounded-btn border border-border bg-paper-soft p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-danger text-xs mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || content.trim().length < 2}
            >
              <Send className="w-4 h-4" />
              {sending ? "שולח..." : "שלח שאלה"}
            </Button>
          </div>
        </div>
      )}

      {!canSend && !isBlocked && (
        <div className="border-t border-border pt-4 text-center">
          <p className="text-ink-muted text-sm">
            <Link href="/login" className="text-primary hover:underline">
              התחבר
            </Link>{" "}
            כדי לשאול שאלה
          </p>
        </div>
      )}

      {isBlocked && (
        <div className="border-t border-border pt-4 text-center">
          <p className="text-danger text-sm">אינך מורשה לשלוח הודעות</p>
        </div>
      )}
    </Card>
  );
}
