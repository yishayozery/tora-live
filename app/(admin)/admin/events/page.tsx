import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { EventApprovalActions } from "@/components/admin/EventApprovalActions";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import Link from "next/link";
import { MapPin, FileImage, Radio, Search, Filter, Calendar as CalIcon, User, Bot } from "lucide-react";
import { BROADCAST_TYPES } from "@/lib/enums";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;       // PENDING | APPROVED | REJECTED | ALL
  organizer?: string;    // rabbi | user | auto | ALL
  broadcastType?: string;
  dateRange?: string;    // upcoming | past | month | ALL
  page?: string;
};

const PAGE_SIZE = 20;

export default async function AdminEventsPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireAdmin();

  const filter = {
    q: (searchParams?.q ?? "").trim(),
    status: searchParams?.status ?? "PENDING",
    organizer: searchParams?.organizer ?? "ALL",
    broadcastType: searchParams?.broadcastType ?? "ALL",
    dateRange: searchParams?.dateRange ?? "ALL",
    page: Math.max(1, parseInt(searchParams?.page ?? "1", 10)),
  };

  // === Build Prisma where ===
  const now = new Date();
  const where: any = {};

  // Status
  if (filter.status !== "ALL") where.approvalStatus = filter.status;

  // Organizer type
  if (filter.organizer === "rabbi") where.rabbiId = { not: null };
  if (filter.organizer === "user") { where.rabbiId = null; where.autoDiscovered = { not: true }; }
  if (filter.organizer === "auto") where.autoDiscovered = true;

  // Broadcast type
  if (filter.broadcastType !== "ALL") where.broadcastType = filter.broadcastType;

  // Date range
  if (filter.dateRange === "upcoming") where.scheduledAt = { gte: now };
  if (filter.dateRange === "past") where.scheduledAt = { lt: now };
  if (filter.dateRange === "month") {
    const monthAhead = new Date(now.getTime() + 30 * 86400000);
    where.scheduledAt = { gte: now, lte: monthAhead };
  }

  // Search
  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q } },
      { description: { contains: filter.q } },
      { organizerName: { contains: filter.q } },
      { locationName: { contains: filter.q } },
    ];
  }

  // Counts for tabs (across all filters EXCEPT status)
  const whereWithoutStatus = { ...where };
  delete whereWithoutStatus.approvalStatus;

  const [items, total, statusCounts] = await Promise.all([
    db.lesson.findMany({
      where,
      include: {
        organizer: { select: { email: true } },
        rabbi: { select: { name: true, slug: true } },
      },
      orderBy: { scheduledAt: filter.dateRange === "past" ? "desc" : "asc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.lesson.count({ where }),
    Promise.all([
      db.lesson.count({ where: { ...whereWithoutStatus, approvalStatus: "PENDING" } }),
      db.lesson.count({ where: { ...whereWithoutStatus, approvalStatus: "APPROVED" } }),
      db.lesson.count({ where: { ...whereWithoutStatus, approvalStatus: "REJECTED" } }),
    ]),
  ]);

  const [pendingCount, approvedCount, rejectedCount] = statusCounts;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildQuery(overrides: Partial<Record<keyof SearchParams, string | number>>): string {
    const params = new URLSearchParams();
    const merged = { ...filter, page: 1, ...overrides };
    if (merged.q) params.set("q", String(merged.q));
    if (merged.status && merged.status !== "PENDING") params.set("status", String(merged.status));
    if (merged.organizer && merged.organizer !== "ALL") params.set("organizer", String(merged.organizer));
    if (merged.broadcastType && merged.broadcastType !== "ALL") params.set("broadcastType", String(merged.broadcastType));
    if (merged.dateRange && merged.dateRange !== "ALL") params.set("dateRange", String(merged.dateRange));
    if (merged.page && merged.page !== 1) params.set("page", String(merged.page));
    return params.toString() ? `?${params.toString()}` : "";
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
          <CalIcon className="w-7 h-7 text-primary" />
          ניהול אירועים ושיעורים
        </h1>
        <p className="text-sm text-ink-muted mt-1">סה"כ: {total} אירועים תחת הסינון הנוכחי</p>
      </header>

      {/* === Status tabs === */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusTab href={buildQuery({ status: "PENDING" })} active={filter.status === "PENDING"} count={pendingCount} label="ממתינים" color="gold" />
        <StatusTab href={buildQuery({ status: "APPROVED" })} active={filter.status === "APPROVED"} count={approvedCount} label="אושרו" color="live" />
        <StatusTab href={buildQuery({ status: "REJECTED" })} active={filter.status === "REJECTED"} count={rejectedCount} label="נדחו" color="danger" />
        <StatusTab href={buildQuery({ status: "ALL" })} active={filter.status === "ALL"} count={pendingCount + approvedCount + rejectedCount} label="הכל" color="primary" />
      </div>

      {/* === Filters bar === */}
      <form className="grid gap-2 sm:grid-cols-4 p-4 bg-paper-soft rounded-card border border-border" method="get">
        {/* preserve status */}
        {filter.status !== "PENDING" && <input type="hidden" name="status" value={filter.status} />}

        <label className="relative sm:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={filter.q}
            placeholder="חפש לפי כותרת, תיאור, מיקום או שם מארגן..."
            className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <select name="organizer" defaultValue={filter.organizer} className="h-11 px-3 rounded-btn border border-border bg-white text-sm">
          <option value="ALL">כל סוגי המארגנים</option>
          <option value="rabbi">רבנים רשומים</option>
          <option value="user">משתמשים/תלמידים</option>
          <option value="auto">שהתגלו אוטומטית</option>
        </select>

        <select name="dateRange" defaultValue={filter.dateRange} className="h-11 px-3 rounded-btn border border-border bg-white text-sm">
          <option value="ALL">כל התאריכים</option>
          <option value="upcoming">עתידיים</option>
          <option value="month">חודש הקרוב</option>
          <option value="past">שעברו</option>
        </select>

        <select name="broadcastType" defaultValue={filter.broadcastType} className="h-11 px-3 rounded-btn border border-border bg-white text-sm sm:col-span-2">
          <option value="ALL">כל סוגי השידור</option>
          {BROADCAST_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>{bt.label}</option>
          ))}
        </select>

        <button type="submit" className="h-11 px-4 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover">
          <Filter className="inline w-4 h-4 ml-1" />
          סנן
        </button>

        {(filter.q || filter.organizer !== "ALL" || filter.broadcastType !== "ALL" || filter.dateRange !== "ALL") && (
          <Link href={buildQuery({ q: "", organizer: "ALL", broadcastType: "ALL", dateRange: "ALL" })} className="h-11 px-4 rounded-btn border border-border bg-white text-ink-muted text-sm flex items-center justify-center hover:text-ink">
            נקה סינון
          </Link>
        )}
      </form>

      {/* === Items === */}
      {items.length === 0 ? (
        <Card>
          <CardDescription>לא נמצאו אירועים לפי הסינון הזה.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <EventCard key={l.id} lesson={l as any} showActions={l.approvalStatus === "PENDING"} />
          ))}
        </div>
      )}

      {/* === Pagination === */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="ניווט בין עמודים">
          {filter.page > 1 && (
            <Link href={buildQuery({ page: filter.page - 1 })} className="h-10 px-4 rounded-btn border border-border bg-white text-sm hover:border-primary">→ הבא</Link>
          )}
          <span className="text-sm text-ink-muted">עמוד {filter.page} מתוך {totalPages}</span>
          {filter.page < totalPages && (
            <Link href={buildQuery({ page: filter.page + 1 })} className="h-10 px-4 rounded-btn border border-border bg-white text-sm hover:border-primary">הקודם ←</Link>
          )}
        </nav>
      )}
    </div>
  );
}

function StatusTab({ href, active, count, label, color }: { href: string; active: boolean; count: number; label: string; color: "gold" | "live" | "danger" | "primary" }) {
  const activeColors: Record<string, string> = {
    gold: "bg-gold text-white border-gold",
    live: "bg-live text-white border-live",
    danger: "bg-danger text-white border-danger",
    primary: "bg-primary text-white border-primary",
  };
  return (
    <Link
      href={href}
      className={`min-h-[40px] px-4 inline-flex items-center gap-2 rounded-full border text-sm transition ${
        active ? activeColors[color] + " shadow-soft" : "bg-white text-ink-soft border-border hover:border-primary"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`text-xs ${active ? "text-white/80" : "text-ink-muted"}`}>({count})</span>
    </Link>
  );
}

type LessonWithOrg = {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  locationName: string | null;
  locationUrl: string | null;
  posterUrl: string | null;
  liveEmbedUrl: string | null;
  organizerName: string | null;
  autoDiscovered: boolean | null;
  organizer: { email: string } | null;
  rabbi: { name: string; slug: string } | null;
  broadcastType: string;
  approvalStatus: string;
};

function EventCard({ lesson: l, showActions }: { lesson: LessonWithOrg; showActions?: boolean }) {
  const organizerLabel = l.rabbi?.name
    ? `🎤 הרב ${l.rabbi.name}`
    : l.autoDiscovered
      ? `🤖 ${l.organizerName ?? "התגלה אוטומטית"}`
      : `👤 ${l.organizerName ?? "משתמש"}`;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="hebrew-serif text-xl font-bold text-ink">{l.title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-soft text-ink-muted border border-border">
              {l.broadcastType}
            </span>
            {l.approvalStatus !== "PENDING" && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                l.approvalStatus === "APPROVED" ? "bg-live/10 text-live border border-live/20" : "bg-danger/10 text-danger border border-danger/20"
              }`}>
                {l.approvalStatus === "APPROVED" ? "✓ אושר" : "✗ נדחה"}
              </span>
            )}
          </div>
          <div className="text-sm text-ink-muted">
            {formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}
          </div>
          <p className="text-sm mt-2 whitespace-pre-line text-ink-soft line-clamp-3">{l.description}</p>
          <div className="mt-3 text-xs text-ink-muted space-y-1">
            <div><span className="font-medium text-ink">{organizerLabel}</span>
              {l.organizer?.email && (
                <span className="text-ink-muted" dir="ltr"> · {l.organizer.email}</span>
              )}
            </div>
            {l.locationName && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{l.locationName}</span>
                {l.locationUrl && <a href={l.locationUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline mr-2">במפה ←</a>}
              </div>
            )}
            {l.posterUrl && (
              <div className="flex items-center gap-1">
                <FileImage className="w-3 h-3" />
                <a href={l.posterUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">פוסטר</a>
              </div>
            )}
            {l.liveEmbedUrl && (
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <a href={l.liveEmbedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">קישור לשידור</a>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs">
            <Link href={`/lesson/${l.id}`} className="text-primary hover:underline">לדף השיעור ←</Link>
          </div>
        </div>
        {showActions && <EventApprovalActions id={l.id} />}
      </div>
    </Card>
  );
}
