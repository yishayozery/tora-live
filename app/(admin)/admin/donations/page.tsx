import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const DEDICATION_LABELS: Record<string, string> = {
  MEMORY: "לזכר",
  HONOR: "לזכות",
  HEALING: "לרפואה",
  SUCCESS: "להצלחה",
};

export default async function AdminDonationsPage() {
  await requireAdmin();

  const donations = await db.donation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const agg = await db.donation.aggregate({
    _sum: { amount: true },
    _count: { _all: true },
  });

  const shekelFmt = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  });
  const numFmt = new Intl.NumberFormat("he-IL");
  const dateFmt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const totalShekels = (agg._sum.amount ?? 0) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="hebrew-serif text-3xl font-bold">תרומות</h1>
        <a
          href="/api/admin/donations/export.csv"
          className="h-11 px-5 rounded-btn bg-gold text-white font-medium inline-flex items-center"
        >
          ייצא ל-CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-ink-muted">סך כולל</div>
          <div className="hebrew-serif text-2xl font-bold text-gold">
            {shekelFmt.format(totalShekels)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-ink-muted">מספר תרומות</div>
          <div className="hebrew-serif text-2xl font-bold">
            {numFmt.format(agg._count._all)}
          </div>
        </Card>
      </div>

      {donations.length === 0 ? (
        <Card>
          <CardDescription>אין תרומות עדיין.</CardDescription>
        </Card>
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {donations.map((d) => (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{d.donorName}</div>
                    <div className="text-xs text-ink-muted" dir="ltr">
                      {d.donorEmail}
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {dateFmt.format(d.createdAt)}
                    </div>
                    {d.dedicationName && (
                      <div className="text-sm mt-2">
                        <span className="text-ink-muted">
                          {d.dedicationType
                            ? DEDICATION_LABELS[d.dedicationType] ||
                              d.dedicationType
                            : ""}
                          :{" "}
                        </span>
                        {d.dedicationName}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 text-xs">
                      <span
                        className={
                          "px-2 py-0.5 rounded-full " +
                          (d.showPublicly
                            ? "bg-gold/10 text-gold"
                            : "bg-paper-soft text-ink-muted")
                        }
                      >
                        {d.showPublicly ? "מוצג בלוח" : "לא מוצג"}
                      </span>
                      <span
                        className={
                          "px-2 py-0.5 rounded-full " +
                          (d.receiptSent
                            ? "bg-live/10 text-live"
                            : "bg-danger/10 text-danger")
                        }
                      >
                        קבלה {d.receiptSent ? "נשלחה" : "לא נשלחה"}
                      </span>
                    </div>
                  </div>
                  <div className="hebrew-serif text-xl font-bold text-gold shrink-0">
                    {shekelFmt.format(d.amount / 100)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-paper-soft text-ink-muted text-right">
                  <tr>
                    <th className="p-3 font-medium">תאריך</th>
                    <th className="p-3 font-medium">שם התורם</th>
                    <th className="p-3 font-medium">מייל</th>
                    <th className="p-3 font-medium">סכום</th>
                    <th className="p-3 font-medium">הקדשה</th>
                    <th className="p-3 font-medium">בלוח</th>
                    <th className="p-3 font-medium">קבלה</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="p-3 text-ink-muted whitespace-nowrap">
                        {dateFmt.format(d.createdAt)}
                      </td>
                      <td className="p-3 font-medium">{d.donorName}</td>
                      <td className="p-3 text-ink-muted" dir="ltr">
                        {d.donorEmail}
                      </td>
                      <td className="p-3 font-bold text-gold whitespace-nowrap">
                        {shekelFmt.format(d.amount / 100)}
                      </td>
                      <td className="p-3">
                        {d.dedicationName ? (
                          <>
                            <span className="text-ink-muted">
                              {d.dedicationType
                                ? (DEDICATION_LABELS[d.dedicationType] ||
                                    d.dedicationType) + ": "
                                : ""}
                            </span>
                            {d.dedicationName}
                          </>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="p-3">{d.showPublicly ? "כן" : "לא"}</td>
                      <td className="p-3">{d.receiptSent ? "ו" : "ח"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
