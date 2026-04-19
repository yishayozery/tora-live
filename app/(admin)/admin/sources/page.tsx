import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { AddSourceForm } from "@/components/admin/AddSourceForm";
import { SourceRow } from "@/components/admin/SourceRow";
import { Youtube, Info } from "lucide-react";

export default async function AdminSourcesPage() {
  await requireAdmin();
  const sources = await db.rabbiSource.findMany({
    orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { lessons: true } } },
  });

  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const enabled = sources.filter((s) => s.enabled);
  const disabled = sources.filter((s) => !s.enabled);

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Youtube className="w-7 h-7 text-danger" />
          <h1 className="hebrew-serif text-3xl font-bold">מקורות YouTube</h1>
        </div>
        <p className="text-ink-soft">
          ערוצי YouTube שהסורק (lesson-scout) עובר עליהם כל יום ב-6:00, מאתר שיעורים חדשים
          ומקים אותם במערכת כ-<strong>ממתינים לאישור</strong>.
        </p>
      </header>

      <Card className="border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-ink-soft">
            <p className="font-bold text-ink mb-1">איך למצוא channelId?</p>
            <p>פתח את ערוץ ה-YouTube → לחץ ימני על התמונה של הערוץ → &quot;צפה במקור של הדף&quot; →
            חפש <code className="bg-white px-1.5 py-0.5 rounded">channelId</code>. או השתמש ב-
            <a href="https://commentpicker.com/youtube-channel-id.php" target="_blank" rel="noreferrer" className="text-primary underline">Channel ID Finder</a>.</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="hebrew-serif text-xl font-bold mb-3">הוסף מקור חדש</h2>
        <AddSourceForm rabbis={rabbis} />
      </section>

      <section>
        <h2 className="hebrew-serif text-xl font-bold mb-3">
          ערוצים פעילים <span className="text-ink-muted text-base">({enabled.length})</span>
        </h2>
        {enabled.length === 0 ? (
          <Card><CardDescription>אין ערוצים פעילים. הוסף את הראשון למעלה.</CardDescription></Card>
        ) : (
          <div className="space-y-2">
            {enabled.map((s) => (
              <SourceRow key={s.id} source={{
                ...s,
                lessonCount: s._count.lessons,
                lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
                lastFoundAt: s.lastFoundAt?.toISOString() ?? null,
              }} />
            ))}
          </div>
        )}
      </section>

      {disabled.length > 0 && (
        <section>
          <h2 className="hebrew-serif text-xl font-bold mb-3 text-ink-muted">
            ערוצים מושבתים <span className="text-base">({disabled.length})</span>
          </h2>
          <div className="space-y-2 opacity-60">
            {disabled.map((s) => (
              <SourceRow key={s.id} source={{
                ...s,
                lessonCount: s._count.lessons,
                lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
                lastFoundAt: s.lastFoundAt?.toISOString() ?? null,
              }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
