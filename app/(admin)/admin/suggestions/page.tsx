import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { SuggestionRow } from "@/components/admin/SuggestionRow";
import { AddSuggestionForm } from "@/components/admin/AddSuggestionForm";
import { Sparkles, Filter } from "lucide-react";

export default async function AdminSuggestionsPage({ searchParams }: { searchParams?: { status?: string } }) {
  await requireAdmin();
  const filter = searchParams?.status ?? "PENDING";

  const [pending, approved, rejected] = await Promise.all([
    db.lessonSuggestion.count({ where: { status: "PENDING" } }),
    db.lessonSuggestion.count({ where: { status: "APPROVED" } }),
    db.lessonSuggestion.count({ where: { status: "REJECTED" } }),
  ]);

  const items = await db.lessonSuggestion.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="hebrew-serif text-3xl font-bold">הצעות שיעורים מהרשת</h1>
          </div>
          <p className="text-ink-soft text-sm">
            הסוכן הסורק מאתר שיעורים ברשתות חברתיות (טלגרם, חדשות, גוגל) ומציע אותם כאן לאישור.
          </p>
        </div>
      </header>

      <AddSuggestionForm />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterTab href="?status=PENDING" active={filter === "PENDING"} count={pending} label="ממתינות" />
        <FilterTab href="?status=APPROVED" active={filter === "APPROVED"} count={approved} label="אושרו" />
        <FilterTab href="?status=REJECTED" active={filter === "REJECTED"} count={rejected} label="נדחו" />
        <FilterTab href="?status=ALL" active={filter === "ALL"} count={pending + approved + rejected} label="הכל" />
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Filter className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <CardDescription>
              {filter === "PENDING"
                ? "אין הצעות חדשות. הסוכן יתעדכן ב-04:00 בלילה הבא."
                : "אין פריטים בקטגוריה זו."}
            </CardDescription>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <SuggestionRow
              key={s.id}
              suggestion={{
                ...s,
                scheduledAt: s.scheduledAt?.toISOString() ?? null,
                reviewedAt: s.reviewedAt?.toISOString() ?? null,
                createdAt: s.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({ href, active, count, label }: { href: string; active: boolean; count: number; label: string }) {
  return (
    <a
      href={href}
      className={`min-h-[40px] px-4 inline-flex items-center gap-2 rounded-full border text-sm transition ${
        active
          ? "bg-primary text-white border-primary shadow-soft"
          : "bg-white text-ink-soft border-border hover:border-primary"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`text-xs ${active ? "text-white/80" : "text-ink-muted"}`}>({count})</span>
    </a>
  );
}
