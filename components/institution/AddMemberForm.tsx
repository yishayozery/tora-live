"use client";

// טופס הוספת חבר למוסד — אימייל + תפקיד.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

type Role = "RAKAZ" | "RABBI" | "VIEWER";

export function AddMemberForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("RABBI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("יש להזין אימייל");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/institutions/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) {
          setError("המשתמש לא קיים במערכת. בקש ממנו להירשם תחילה.");
        } else {
          setError(data?.error || "שגיאה בהוספת החבר");
        }
        return;
      }
      setSuccess(`נוסף בהצלחה: ${email.trim()}`);
      setEmail("");
      setRole("RABBI");
      router.refresh();
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>הוספת חבר</CardTitle>
      <p className="text-sm text-ink-muted -mt-1 mb-3">
        הזן את האימייל של המשתמש (חייב להיות רשום במערכת) ובחר תפקיד.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr,160px]">
          <div>
            <label htmlFor="member-email" className="block text-sm font-medium text-ink mb-1">
              אימייל <span className="text-danger">*</span>
            </label>
            <input
              id="member-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rabbi@example.com"
              required
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-ink mb-1">
              תפקיד
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="RABBI">רב</option>
              <option value="RAKAZ">רכז</option>
              <option value="VIEWER">צופה</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-live" role="status">
            {success}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={loading}>
            <UserPlus className="w-4 h-4" />
            {loading ? "מוסיף…" : "הוסף חבר"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
