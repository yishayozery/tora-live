import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";

export default async function AdminHome() {
  await requireAdmin();
  const [rabbisTotal, rabbisPending, students, lessons, reportsOpen, donations] = await Promise.all([
    db.rabbi.count(),
    db.rabbi.count({ where: { status: "PENDING" } }),
    db.student.count(),
    db.lesson.count(),
    db.report.count({ where: { status: "OPEN" } }),
    db.donation.count(),
  ]);

  const stats = [
    { label: "רבנים", value: rabbisTotal },
    { label: "ממתינים לאישור", value: rabbisPending, highlight: rabbisPending > 0 },
    { label: "תלמידים", value: students },
    { label: "שיעורים", value: lessons },
    { label: "דיווחים פתוחים", value: reportsOpen, highlight: reportsOpen > 0 },
    { label: "תרומות", value: donations },
  ];

  return (
    <div className="space-y-6">
      <h1 className="hebrew-serif text-3xl font-bold">סקירת מערכת</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className={s.highlight ? "border-gold" : ""}>
            <div className="text-sm text-ink-muted">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value.toLocaleString("he-IL")}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
