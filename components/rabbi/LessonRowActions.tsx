"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Trash2, Edit, StopCircle, Globe, Lock } from "lucide-react";

type Props = {
  lessonId: string;
  /** האם השיעור כרגע במצב isLive=true — מציג גם "סיים שידור" */
  isLive?: boolean;
  /** האם השיעור כרגע ציבורי — מציג כפתור החלפה */
  isPublic?: boolean;
  /** האם להציג גם "ערוך"? (לרוב כן) */
  showEdit?: boolean;
  /** אחרי מחיקה מוצלחת — לאן לנווט (default: refresh) */
  redirectTo?: string;
};

export function LessonRowActions({ lessonId, isLive, isPublic, showEdit = true, redirectTo }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePublic() {
    if (typeof isPublic !== "boolean") return;
    const next = !isPublic;
    if (!window.confirm(
      next
        ? "להפוך את השיעור לציבורי? הוא יופיע בלוח השיעורים של דף הבית."
        : "להפוך את השיעור לפרטי? הוא ייעלם מלוח השיעורים הציבורי."
    )) return;
    setBusy(true);
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`שגיאה: ${j.error ?? "unknown"}`);
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("למחוק את השיעור? פעולה לא הפיכה.\nכל הסימוניות, הצ'אט והדיווחים יימחקו גם.")) return;
    setBusy(true);
    const res = await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`שגיאה במחיקה: ${j.error ?? "unknown"}`);
      return;
    }
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  async function forceEndLive() {
    if (!window.confirm("לסמן את השיעור כסיים? (השיעור ייעלם מ'משדרים עכשיו')")) return;
    setBusy(true);
    const res = await fetch(`/api/lessons/${lessonId}/live`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLive: false }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`שגיאה: ${j.error ?? "unknown"}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isLive && (
        <button
          type="button"
          onClick={forceEndLive}
          disabled={busy}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-btn bg-danger text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
          title="סיים את השידור החי"
        >
          <StopCircle className="w-3.5 h-3.5" />
          סיים שידור
        </button>
      )}
      {typeof isPublic === "boolean" && (
        <button
          type="button"
          onClick={togglePublic}
          disabled={busy}
          className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-btn border text-xs font-medium disabled:opacity-50 transition ${
            isPublic
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              : "bg-paper-soft border-border text-ink-soft hover:bg-paper-warm"
          }`}
          title={isPublic ? "ציבורי — לחץ להפוך לפרטי" : "פרטי — לחץ לפרסם בלוח"}
        >
          {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isPublic ? "ציבורי" : "פרטי"}
        </button>
      )}
      {showEdit && (
        <Link
          href={`/dashboard/lessons/${lessonId}/edit`}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-btn border border-border bg-white text-ink-soft text-xs font-medium hover:bg-paper-soft"
          title="ערוך"
        >
          <Edit className="w-3.5 h-3.5" />
          ערוך
        </Link>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-btn border border-danger/30 bg-white text-danger text-xs font-medium hover:bg-danger/10 disabled:opacity-50"
        title="מחק"
      >
        <Trash2 className="w-3.5 h-3.5" />
        מחק
      </button>
    </div>
  );
}
