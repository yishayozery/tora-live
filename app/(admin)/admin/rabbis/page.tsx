import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { RabbiActions } from "@/components/admin/RabbiActions";

export default async function AdminRabbisPage() {
  await requireAdmin();
  const rabbis = await db.rabbi.findMany({
    include: { user: { select: { email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = rabbis.filter((r) => r.status === "PENDING");
  const approved = rabbis.filter((r) => r.status === "APPROVED");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="hebrew-serif text-3xl font-bold mb-4">
          ממתינים לאישור <span className="text-ink-muted text-lg">({pending.length})</span>
        </h1>
        {pending.length === 0 ? (
          <Card><CardDescription>אין בקשות ממתינות.</CardDescription></Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-sm text-ink-muted" dir="ltr">{r.user.email}</div>
                    <p className="text-sm text-ink-soft mt-2 whitespace-pre-line line-clamp-4">{r.bio}</p>
                    <div className="text-xs text-ink-muted mt-2" dir="ltr">/rabbi/{r.slug}</div>
                  </div>
                  <RabbiActions id={r.id} status={r.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-4">
          רבנים מאושרים <span className="text-ink-muted text-base">({approved.length})</span>
        </h2>
        <div className="space-y-2">
          {approved.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold">{r.name}</div>
                  <div className="text-xs text-ink-muted" dir="ltr">/rabbi/{r.slug} · {r.user.email}</div>
                </div>
                <RabbiActions id={r.id} status={r.status} blocked={r.isBlocked} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
