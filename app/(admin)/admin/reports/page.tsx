import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { ReportActions } from "@/components/admin/ReportActions";
import { SuspendedLessonActions } from "@/components/admin/SuspendedLessonActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  INAPPROPRIATE: "תוכן לא הולם",
  SPAM: "ספאם",
  COPYRIGHT: "הפרת זכויות",
  TECHNICAL: "בעיה טכנית",
  OTHER: "אחר",
};

function categoryLabel(c: string) {
  return CATEGORY_LABELS[c] || c;
}

export default async function AdminReportsPage() {
  await requireAdmin();

  const [open, resolved, suspended] = await Promise.all([
    db.report.findMany({
      where: { status: "OPEN" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            rabbi: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.report.findMany({
      where: { status: { not: "OPEN" } },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            rabbi: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.lesson.findMany({
      where: { isSuspended: true },
      select: {
        id: true,
        title: true,
        reportCount: true,
        rabbi: { select: { name: true, slug: true } },
        organizerName: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const dateFmt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  function renderReport(r: (typeof open)[number]) {
    return (
      <Card key={r.id}>
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger font-medium">
                {categoryLabel(r.category)}
              </span>
              <span className="text-xs text-ink-muted">
                {dateFmt.format(r.createdAt)}
              </span>
            </div>
            <p className="text-sm mt-2 whitespace-pre-line">{r.description}</p>
            {r.lesson && (
              <div className="text-xs mt-2">
                <Link
                  href={`/lesson/${r.lesson.id}`}
                  className="text-primary hover:underline"
                >
                  {r.lesson.title}
                </Link>
                <span className="text-ink-muted"> · {r.lesson.rabbi.name}</span>
              </div>
            )}
            {r.reporterEmail && (
              <div className="text-xs text-ink-muted mt-1" dir="ltr">
                {r.reporterEmail}
              </div>
            )}
          </div>
          {r.status === "OPEN" && (
            <ReportActions id={r.id} hasLesson={!!r.lessonId} />
          )}
          {r.status !== "OPEN" && (
            <span className="text-xs text-ink-muted">סגור</span>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {suspended.length > 0 && (
        <section>
          <h2 className="hebrew-serif text-2xl font-bold mb-4">
            שיעורים מושהים{" "}
            <span className="text-ink-muted text-base">({suspended.length})</span>
          </h2>
          <div className="space-y-3">
            {suspended.map((l) => (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/lesson/${l.id}`}
                      className="font-bold text-ink hover:text-primary"
                    >
                      {l.title}
                    </Link>
                    <div className="text-xs text-ink-muted mt-1">
                      {l.rabbi?.name ?? l.organizerName ?? "—"} ·{" "}
                      {l.reportCount} דיווחים
                    </div>
                  </div>
                  <SuspendedLessonActions id={l.id} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h1 className="hebrew-serif text-3xl font-bold mb-4">
          דיווחים פתוחים{" "}
          <span className="text-ink-muted text-lg">({open.length})</span>
        </h1>
        {open.length === 0 ? (
          <Card>
            <CardDescription>אין דיווחים פתוחים.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">{open.map(renderReport)}</div>
        )}
      </section>

      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-4">
          דיווחים סגורים{" "}
          <span className="text-ink-muted text-base">({resolved.length})</span>
        </h2>
        {resolved.length === 0 ? (
          <Card>
            <CardDescription>אין דיווחים סגורים.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">{resolved.map(renderReport)}</div>
        )}
      </section>
    </div>
  );
}
