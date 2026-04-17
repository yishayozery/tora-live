"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Edit2, Check, X, FolderOpen } from "lucide-react";

type Category = { id: string; name: string; order: number; lessonsCount: number };

export function CategoriesManager() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/me/categories");
    if (res.ok) setCats(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function add() {
    if (!newName.trim()) return;
    setErr(null);
    start(async () => {
      const res = await fetch("/api/me/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "שגיאה");
        return;
      }
      setNewName("");
      await load();
    });
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return;
    setErr(null);
    start(async () => {
      const res = await fetch(`/api/me/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "שגיאה");
        return;
      }
      setEditingId(null);
      await load();
    });
  }

  function remove(id: string, lessonsCount: number) {
    if (lessonsCount > 0) {
      setErr(`לא ניתן למחוק — יש ${lessonsCount} שיעורים בקטגוריה`);
      return;
    }
    if (!confirm("למחוק את הקטגוריה?")) return;
    setErr(null);
    start(async () => {
      const res = await fetch(`/api/me/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "שגיאה");
        return;
      }
      await load();
    });
  }

  return (
    <Card>
      <h2 className="hebrew-serif text-xl font-bold mb-2 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary" /> הקטגוריות שלי
      </h2>
      <p className="text-sm text-ink-muted mb-4">
        קטגוריות לסיווג השיעורים שלך — לדוגמה: דף יומי, פרשת שבוע, הלכה.
      </p>

      {loading ? (
        <div className="text-sm text-ink-muted py-4">טוען...</div>
      ) : cats.length === 0 ? (
        <div className="text-sm text-ink-muted bg-paper-soft p-3 rounded-btn mb-3">
          אין עדיין קטגוריות. הוסף קטגוריה ראשונה למטה.
        </div>
      ) : (
        <ul className="space-y-2 mb-4">
          {cats.map((c) => (
            <li key={c.id} className="flex items-center gap-2 p-2 border border-border rounded-btn">
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)}
                    className="flex-1 h-9 px-2 border border-border rounded-btn"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveEdit(c.id)} disabled={pending}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span className="text-xs text-ink-muted">{c.lessonsCount} שיעורים</span>
                  <button
                    onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                    className="p-1.5 text-ink-muted hover:text-primary"
                    aria-label="ערוך"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(c.id, c.lessonsCount)}
                    className="p-1.5 text-ink-muted hover:text-danger disabled:opacity-50"
                    disabled={c.lessonsCount > 0}
                    title={c.lessonsCount > 0 ? "לא ניתן למחוק קטגוריה עם שיעורים" : "מחק"}
                    aria-label="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* הוספה חדשה */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="שם קטגוריה חדשה..."
          className="flex-1 h-10 px-3 rounded-btn border border-border bg-white"
        />
        <Button onClick={add} disabled={pending || !newName.trim()}>
          <Plus className="w-4 h-4" /> הוסף
        </Button>
      </div>
      {err && <div className="text-sm text-danger mt-2">{err}</div>}
    </Card>
  );
}
