"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";

type Props = {
  lessonId: string;
  initialBookmarked: boolean;
  /** האם המשתמש מחובר ומאפשר לסמן (סטודנט פעיל). */
  canBookmark: boolean;
};

/**
 * אייקון סימון מהיר עבור לוח השיעורים.
 * - לחיצה: מסמן/מבטל ב-DB עם optimistic update.
 * - לא מחובר: מפנה ל-/login עם callbackUrl לדף הקודם.
 */
export function CalendarBookmarkIcon({ lessonId, initialBookmarked, canBookmark }: Props) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canBookmark) {
      const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.push(`/login?callbackUrl=${encodeURIComponent(next)}`);
      return;
    }
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    start(async () => {
      try {
        const res = await fetch(`/api/bookmarks/${lessonId}`, {
          method: next ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: next ? JSON.stringify({ remindBeforeMin: 30 }) : undefined,
        });
        if (!res.ok) setBookmarked(!next); // rollback
      } catch {
        setBookmarked(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={bookmarked ? "הסר מהלוח שלי" : "הוסף ללוח שלי"}
      title={bookmarked ? "הסר מהלוח שלי" : "הוסף ללוח שלי"}
      className={
        "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary " +
        (bookmarked
          ? "bg-primary text-white hover:bg-primary-hover"
          : "bg-white border border-border text-ink-muted hover:border-primary hover:text-primary")
      }
    >
      {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
    </button>
  );
}
