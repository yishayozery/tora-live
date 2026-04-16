"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";

interface ContactRabbiButtonProps {
  rabbiId: string;
  canSend: boolean;
  isBlocked: boolean;
}

export function ContactRabbiButton({ rabbiId, canSend, isBlocked }: ContactRabbiButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
        <MessageSquare className="w-4 h-4" /> התחבר כדי לשאול שאלה
      </Link>
    );
  }

  function handleSend() {
    if (message.trim().length < 10) {
      setError("הודעה חייבת להכיל לפחות 10 תווים");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rabbi/${rabbiId}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim() }),
        });
        if (res.ok) {
          setSuccess(true);
          setMessage("");
          setTimeout(() => {
            setSuccess(false);
            setOpen(false);
          }, 2000);
        } else {
          const data = await res.json();
          setError(data.error || "שגיאה בשליחה");
        }
      } catch {
        setError("שגיאה בשליחה");
      }
    });
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare className="w-4 h-4" />
        שלח שאלה
      </Button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:w-80 z-20 rounded-card border border-border bg-white shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-ink">שלח שאלה לרב</span>
            <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <p className="text-live text-sm">הפנייה נשלחה בהצלחה!</p>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתוב את שאלתך (לפחות 10 תווים)..."
                rows={3}
                className="w-full rounded-btn border border-border bg-paper-soft p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {error && <p className="text-danger text-xs mt-1">{error}</p>}
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleSend} disabled={sending}>
                  <Send className="w-4 h-4" />
                  {sending ? "שולח..." : "שלח"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
