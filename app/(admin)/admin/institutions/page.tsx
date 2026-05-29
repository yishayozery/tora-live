// ניהול מוסדות (ישיבות) — אדמין בלבד. רשימה + יצירה.
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { CreateInstitutionForm } from "@/components/institution/CreateInstitutionForm";
import { Building2, MapPin, Radio, Users, BookOpen } from "lucide-react";

export const metadata = {
  title: "מוסדות | אדמין TORA_LIVE",
};

export default async function AdminInstitutionsPage() {
  await requireAdmin();

  const institutions = await db.institution.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rooms: true, members: true, lessons: true } } },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl font-bold text-ink leading-tight">מוסדות</h1>
      </div>
      <p className="text-ink-soft mb-6">
        ישיבות וכוללים עם חדרי שידור קבועים. כל מוסד מנוהל על ידי רכז.
      </p>

      <div className="mb-8">
        <CreateInstitutionForm />
      </div>

      <h2 className="font-display text-xl font-bold text-ink mb-3">
        מוסדות קיימים ({institutions.length})
      </h2>

      {institutions.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-sm">עדיין אין מוסדות. צור את הראשון למעלה.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {institutions.map((inst) => (
            <Link
              key={inst.id}
              href={`/dashboard/institution/${inst.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card"
            >
              <Card className="h-full hover:shadow-soft transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="hebrew-serif text-lg font-bold text-ink">{inst.name}</h3>
                  {!inst.isActive && (
                    <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full shrink-0">
                      לא פעיל
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-ink-muted flex items-center gap-2 flex-wrap">
                  <span dir="ltr" className="font-mono text-xs">/{inst.slug}</span>
                  {inst.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {inst.city}
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1" title="חדרים">
                    <Radio className="w-4 h-4 text-live" /> {inst._count.rooms}
                  </span>
                  <span className="inline-flex items-center gap-1" title="חברים">
                    <Users className="w-4 h-4" /> {inst._count.members}
                  </span>
                  <span className="inline-flex items-center gap-1" title="שיעורים">
                    <BookOpen className="w-4 h-4" /> {inst._count.lessons}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
