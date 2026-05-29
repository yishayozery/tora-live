"use client";

// טופס יצירת מוסד חדש (אדמין). לאחר יצירה מציג קישור לדשבורד הרכז.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Check } from "lucide-react";

type Created = { slug: string; rakazAssigned: boolean };

export function CreateInstitutionForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    rakazEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "שגיאה ביצירת המוסד");
        return;
      }
      setCreated({ slug: data.slug, rakazAssigned: !!data.rakazAssigned });
      router.refresh();
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <Card className="border-live/30 bg-live/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-live/15 text-live">
            <Check className="w-5 h-5" />
          </span>
          <CardTitle className="mb-0">המוסד נוצר!</CardTitle>
        </div>
        <p className="text-sm text-ink-soft mb-4">
          {created.rakazAssigned
            ? "הרכז שובץ בהצלחה."
            : "האימייל של הרכז לא תואם משתמש קיים — ניתן לשבץ רכז מאוחר יותר."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/institution/${created.slug}`}>
            <Button>מעבר לדשבורד הרכז</Button>
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setForm({
                name: "",
                slug: "",
                city: "",
                address: "",
                contactEmail: "",
                contactPhone: "",
                rakazEmail: "",
              });
            }}
            className="text-sm text-ink-muted hover:text-ink"
          >
            יצירת מוסד נוסף
          </button>
        </div>
      </Card>
    );
  }

  const inputClass =
    "w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <Card>
      <CardTitle>מוסד חדש</CardTitle>
      <form onSubmit={handleSubmit} className="mt-2 grid gap-4 sm:grid-cols-2">
        <Field label="שם המוסד" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="ישיבת אור החיים"
            required
            className={inputClass}
          />
        </Field>
        <Field label="סלאג (אנגלית, מקפים)" required>
          <input
            type="text"
            dir="ltr"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="or-hachaim"
            pattern="[a-z0-9-]+"
            required
            className={inputClass}
          />
        </Field>
        <Field label="עיר">
          <input
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="ירושלים"
            className={inputClass}
          />
        </Field>
        <Field label="כתובת">
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="רחוב הנביאים 12"
            className={inputClass}
          />
        </Field>
        <Field label="אימייל ליצירת קשר">
          <input
            type="email"
            dir="ltr"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="office@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="טלפון ליצירת קשר">
          <input
            type="tel"
            dir="ltr"
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="02-1234567"
            className={inputClass}
          />
        </Field>
        <Field label="אימייל הרכז הראשון" hint="(אם המשתמש קיים, ישובץ כרכז)">
          <input
            type="email"
            dir="ltr"
            value={form.rakazEmail}
            onChange={(e) => update("rakazEmail", e.target.value)}
            placeholder="rakaz@example.com"
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="sm:col-span-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            <Plus className="w-4 h-4" />
            {loading ? "יוצר…" : "צור מוסד"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">
        {label}
        {required && <span className="text-danger"> *</span>}
        {hint && <span className="text-ink-muted font-normal"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}
