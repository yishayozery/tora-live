"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { label: "10 דק׳", value: 10 },
  { label: "30 דק׳", value: 30 },
  { label: "שעה", value: 60 },
  { label: "יום לפני", value: 24 * 60 },
];

export function BookmarkButton({
  lessonId,
  initialBookmarked,
  initialRemindBefore,
  canBookmark,
}: {
  lessonId: string;
  initialBookmarked: boolean;
  initialRemindBefore?: number;
  canBookmark: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [remind, setRemind] = useState(initialRemindBefore ?? 30);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!canBookmark) {
    return (
      <a
        href={`/login?callbackUrl=/lesson/${lessonId}`}
        className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-border bg-white text-ink-soft text-sm"
      >
        <Bell className="w-4 h-4" /> התחבר להוספה ללוח שלי
      </a>
    );
  }

  function save(min: number) {
    start(async () => {
      const res = await fetch(`/api/bookmarks/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remindBeforeMin: min }),
      });
      if (res.ok) {
        setBookmarked(true);
        setRemind(min);
        setOpen(false);
        router.refresh();
      }
    });
  }

  function remove() {
    start(async () => {
      const res = await fetch(`/api/bookmarks/${lessonId}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarked(false);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className={cn(
          "h-10 px-4 inline-flex items-center gap-2 rounded-btn text-sm font-medium transition",
          bookmarked
            ? "bg-gold-soft text-gold border border-gold/30"
            : "bg-primary text-white hover:bg-primary-hover"
        )}
      >
        {bookmarked ? <Bell className="w-4 h-4 fill-current" /> : <Bell className="w-4 h-4" />}
        {bookmarked ? `תזכורת ${OPTIONS.find((o) => o.value === remind)?.label ?? ""}` : "הוסף ללוח שלי"}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 right-0 w-56 bg-white border border-border rounded-card shadow-soft p-2">
          <div className="text-xs text-ink-muted px-2 py-1">תזכיר אותי לפני השיעור:</div>
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => save(o.value)}
              className={cn(
                "w-full text-right px-3 py-2 text-sm rounded hover:bg-paper-soft",
                bookmarked && remind === o.value && "bg-gold-soft text-gold"
              )}
            >
              {o.label}
            </button>
          ))}
          {bookmarked && (
            <button
              onClick={remove}
              className="w-full text-right px-3 py-2 text-sm rounded text-danger hover:bg-danger/5 flex items-center gap-2"
            >
              <BellOff className="w-4 h-4" /> הסר מהלוח
            </button>
          )}
        </div>
      )}
    </div>
  );
}
