"use client";

// כפתור הסרת חבר מהמוסד עם אישור.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function RemoveMemberButton({
  slug,
  memberId,
  memberLabel,
}: {
  slug: string;
  memberId: string;
  memberLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (loading) return;
    const ok = window.confirm(`להסיר את ${memberLabel} מהמוסד?`);
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/institutions/${slug}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "שגיאה בהסרת החבר");
        return;
      }
      router.refresh();
    } catch {
      alert("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border bg-white text-danger hover:bg-danger/5 hover:border-danger/30 text-sm font-medium disabled:opacity-50 transition-colors"
      aria-label={`הסר את ${memberLabel}`}
    >
      <Trash2 className="w-4 h-4" />
      {loading ? "מסיר…" : "הסר"}
    </button>
  );
}
