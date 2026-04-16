"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2 } from "lucide-react";

type Topic = { value: string; label: string };

export function ContactForm({ topics }: { topics: Topic[] }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "general",
    message: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה בשליחה, נסה שוב");
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <Card className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-live mx-auto mb-4" />
        <h2 className="hebrew-serif text-2xl font-bold text-ink">ההודעה נשלחה</h2>
        <p className="text-ink-soft mt-2">
          תודה שפנית אלינו. נחזור אליך בהקדם האפשרי.
        </p>
        <button
          onClick={() => { setOk(false); setForm({ name: "", email: "", phone: "", topic: "general", message: "" }); }}
          className="mt-6 text-primary text-sm hover:underline"
        >
          שלח פנייה נוספת
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="שם מלא" required>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="ישראל ישראלי"
            />
          </F>
          <F label="מייל" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input" dir="ltr"
              placeholder="email@example.com"
            />
          </F>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="טלפון (אופציונלי)">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input" dir="ltr"
              placeholder="050-1234567"
            />
          </F>
          <F label="נושא הפנייה" required>
            <select
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="input"
            >
              {topics.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </F>
        </div>
        <F label="הודעה" required>
          <textarea
            required minLength={10} rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="input min-h-[8rem] py-2"
            placeholder="תאר את הפנייה שלך..."
          />
        </F>
        {err && <div className="text-sm text-danger">{err}</div>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            <Send className="w-4 h-4" />
            {loading ? "שולח..." : "שלח פנייה"}
          </Button>
        </div>
      </form>
      <style jsx>{`.input { width: 100%; height: 2.75rem; padding: 0 .75rem; border-radius: 10px; border: 1px solid #E5E7EB; background: white; }`}</style>
    </Card>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-ink-soft mb-1 font-medium">
        {label}
        {required && <span className="text-danger mr-1">*</span>}
      </label>
      {children}
    </div>
  );
}
