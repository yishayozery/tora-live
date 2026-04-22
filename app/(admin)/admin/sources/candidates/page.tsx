import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { CandidateRow } from "@/components/admin/CandidateRow";
import { CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  yeshiva: "ישיבות",
  rabbi: "רבנים",
  midrasha: "מדרשות נשים",
  org: "ארגונים",
  facebook_only: "Facebook בלבד",
};

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string };
}) {
  await requireAdmin();

  const statusFilter = searchParams.status || "PENDING";
  const categoryFilter = searchParams.category || "";

  const where: any = {};
  if (statusFilter !== "ALL") where.reviewStatus = statusFilter;
  if (categoryFilter) where.category = categoryFilter;

  const candidates = await db.sourceCandidate.findMany({
    where,
    orderBy: [{ reviewStatus: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
  });

  const counts = await db.sourceCandidate.groupBy({
    by: ["reviewStatus"],
    _count: { reviewStatus: true },
  });
  const countByStatus = Object.fromEntries(counts.map((c) => [c.reviewStatus, c._count.reviewStatus]));
  const total = Object.values(countByStatus).reduce((s: number, n: any) => s + n, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="hebrew-serif text-3xl font-bold">מועמדי מקורות</h1>
            <p className="text-ink-soft mt-1">
              ערוצים שהסוכן איתר — עבור ואשר/דחה. אישור יוצר מקור חדש אוטומטית.
            </p>
          </div>
          <Link
            href="/admin/sources"
            className="text-sm text-primary hover:underline"
          >
            ← מקורות פעילים
          </Link>
        </div>
      </header>

      {/* Stats + filter tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-border pb-3">
        <FilterLink href={{ status: "PENDING" }} currentStatus={statusFilter} label="ממתינים" count={countByStatus.PENDING || 0} icon={Clock} color="primary" />
        <FilterLink href={{ status: "APPROVED" }} currentStatus={statusFilter} label="אושרו" count={countByStatus.APPROVED || 0} icon={CheckCircle2} color="live" />
        <FilterLink href={{ status: "REJECTED" }} currentStatus={statusFilter} label="נדחו" count={countByStatus.REJECTED || 0} icon={XCircle} color="danger" />
        <FilterLink href={{ status: "ALL" }} currentStatus={statusFilter} label={`הכל (${total})`} icon={Filter} color="ink" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap text-sm">
        <Link href={`?status=${statusFilter}`} className={`h-8 px-3 inline-flex items-center rounded-full border transition ${!categoryFilter ? "bg-ink text-white border-ink" : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"}`}>
          כל הקטגוריות
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`?status=${statusFilter}&category=${key}`}
            className={`h-8 px-3 inline-flex items-center rounded-full border transition ${categoryFilter === key ? "bg-primary text-white border-primary" : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* List */}
      {candidates.length === 0 ? (
        <Card>
          <CardDescription>
            אין מועמדים {statusFilter === "PENDING" ? "ממתינים" : statusFilter === "APPROVED" ? "מאושרים" : statusFilter === "REJECTED" ? "נדחים" : ""}.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => (
            <CandidateRow key={c.id} candidate={{
              ...c,
              createdAt: c.createdAt.toISOString(),
              reviewedAt: c.reviewedAt?.toISOString() ?? null,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href, currentStatus, label, count, icon: Icon, color,
}: {
  href: { status: string };
  currentStatus: string;
  label: string;
  count?: number;
  icon: any;
  color: "primary" | "live" | "danger" | "ink";
}) {
  const active = currentStatus === href.status;
  const colorClass = {
    primary: active ? "bg-primary text-white" : "text-primary",
    live: active ? "bg-live text-white" : "text-live",
    danger: active ? "bg-danger text-white" : "text-danger",
    ink: active ? "bg-ink text-white" : "text-ink-soft",
  }[color];
  return (
    <Link
      href={`?status=${href.status}`}
      className={`h-9 px-3 rounded-btn inline-flex items-center gap-2 font-medium text-sm transition ${active ? colorClass : `bg-white border border-border ${colorClass} hover:shadow-soft`}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && !active && (
        <span className="text-xs opacity-70">({count})</span>
      )}
    </Link>
  );
}
