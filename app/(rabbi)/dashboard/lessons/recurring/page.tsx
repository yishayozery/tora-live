import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus, Repeat } from "lucide-react";
import { RecurringTemplateCard } from "@/components/rabbi/RecurringTemplateCard";
import { getUpcomingHolidayConflicts } from "@/lib/recurring-lessons";

export const dynamic = "force-dynamic";

export default async function RecurringLessonsPage() {
  const { rabbi } = await requireApprovedRabbi();

  const templates = await db.recurringLessonTemplate.findMany({
    where: { rabbiId: rabbi.id },
    include: { _count: { select: { lessons: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const conflicts = await getUpcomingHolidayConflicts(rabbi.id, 14);

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="hebrew-serif text-3xl font-bold flex items-center gap-2">
            <Repeat className="w-7 h-7 text-primary" /> שיעורים קבועים
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            הגדרת שיעור יומי/שבועי קבוע — המערכת תיצור את כל השיעורים אוטומטית, תדלג על שבת וחגים.
          </p>
        </div>
        <Link
          href="/dashboard/lessons/recurring/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition shadow-soft"
        >
          <Plus className="w-4 h-4" />
          תבנית חדשה
        </Link>
      </header>

      {/* התראות חגים — שבועיים קדימה */}
      {conflicts.length > 0 && (
        <Card className="border-gold/40 bg-gold-soft/30">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-ink mb-2">⚠ התנגשויות עם חגים בשבועיים הקרובים</h3>
              <p className="text-sm text-ink-soft mb-3">
                השיעורים הבאים יתבטלו בגלל החג — אם תרצה להעביר ליום אחר, פתח את השיעור הספציפי בלוח שלך:
              </p>
              <ul className="space-y-1.5 text-sm">
                {conflicts.map((c, i) => {
                  const dateHe = new Intl.DateTimeFormat("he-IL-u-ca-hebrew-nu-hebr", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(c.date);
                  return (
                    <li key={i} className="flex items-center gap-2 text-ink">
                      <span className="text-gold font-bold">•</span>
                      <span><strong>{c.holiday}</strong> — {dateHe} ב-{c.time}</span>
                      <span className="text-ink-muted text-xs">({c.templateTitle})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* רשימת תבניות */}
      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Repeat className="w-12 h-12 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-soft mb-2">עוד אין תבניות שיעור קבוע</p>
            <p className="text-xs text-ink-muted mb-6">
              צור תבנית — הגדר שעות לכל יום בשבוע, והמערכת תייצר את כל השיעורים ל-6 חודשים קדימה.
            </p>
            <Link
              href="/dashboard/lessons/recurring/new"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
            >
              <Plus className="w-4 h-4" />
              צור תבנית ראשונה
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <RecurringTemplateCard
              key={t.id}
              template={{
                id: t.id,
                title: t.title,
                schedule: JSON.parse(t.schedule),
                startDate: t.startDate.toISOString(),
                endDate: t.endDate.toISOString(),
                status: t.status,
                isPublic: t.isPublic,
                lessonCount: t._count.lessons,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
