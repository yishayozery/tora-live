"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

type Props = {
  followId: string;
  initialIsHelper: boolean;
  studentName: string;
};

export function HelperToggle({ followId, initialIsHelper, studentName }: Props) {
  const router = useRouter();
  const [isHelper, setIsHelper] = useState(initialIsHelper);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !isHelper;
    setError(null);
    setIsHelper(next); // optimistic
    start(async () => {
      const res = await fetch("/api/rabbi/helpers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followId, isStreamHelper: next }),
      });
      if (!res.ok) {
        setIsHelper(!next); // rollback
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "שגיאה בעדכון");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isHelper}
        aria-label={isHelper ? `הסר את ${studentName} מעוזרי שידור` : `סמן את ${studentName} כעוזר שידור`}
        className={
          "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-btn text-xs font-semibold border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 " +
          (isHelper
            ? "bg-gold/10 border-gold/40 text-gold hover:bg-gold/20"
            : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary")
        }
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isHelper ? (
          <ShieldCheck className="w-3.5 h-3.5" />
        ) : (
          <ShieldOff className="w-3.5 h-3.5" />
        )}
        {isHelper ? "עוזר שידור" : "הפוך לעוזר"}
      </button>
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
