import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { LessonDeleteButton } from "@/components/admin/LessonDeleteButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

const BROADCAST_TYPES: Record<string, string> = {
  LESSON: "שיעור",
  PRAYER: "תפילה",
  SELICHOT: "סליחות",
  EVENT: "אירוע",
  TEHILLIM: "תהילים",
};

const LANGUAGES: Record<string, string> = {
  he: "עברית",
  en: "אנגלית",
  yi: "יידיש",
  fr: "צרפתית",
  es: "ספרדית",
  ru: "רוסית",
  ladino: "לאדינו",
  other: "אחר",
};

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: { rabbiId?: string; type?: string; lang?: string; sort?: string };
}) {
  await requireAdmin();

  const { rabbiId, type, lang, sort } = searchParams;

  const where: any = {};
  if (rabbiId) where.rabbiId = rabbiId;
  if (type) where.broadcastType = type;
  if (lang) where.language = lang;

  const orderBy: any =
    sort === "createdAt"
      ? { createdAt: "desc" }
      : { scheduledAt: "desc" };

  const [lessons, rabbis] = await Promise.all([
    db.lesson.findMany({
      where,
      include: {
        rabbi: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
      take: 100,
    }),
    db.rabbi.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const fmt = new Intl.NumberFormat("he-IL");
  const dateFmt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="hebrew-serif text-3xl font-bold">שיעורים</h1>
        <div className="text-sm text-ink-muted">מוצגים {fmt.format(lessons.length)}</div>
      </div>

      <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select
          name="rabbiId"
          defaultValue={rabbiId || ""}
          className="h-11 px-3 rounded-btn border border-border bg-white"
        >
          <option value="">כל הרבנים</option>
          {rabbis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type || ""}
          className="h-11 px-3 rounded-btn border border-border bg-white"
        >
          <option value="">כל הסוגים</option>
          {Object.entries(BROADCAST_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="lang"
          defaultValue={lang || ""}
          className="h-11 px-3 rounded-btn border border-border bg-white"
        >
          <option value="">כל השפות</option>
          {Object.entries(LANGUAGES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort || "scheduledAt"}
            className="h-11 flex-1 px-3 rounded-btn border border-border bg-white"
          >
            <option value="scheduledAt">לפי מועד</option>
            <option value="createdAt">לפי תאריך יצירה</option>
          </select>
          <button
            type="submit"
            className="h-11 px-5 rounded-btn bg-primary text-white font-medium"
          >
            סנן
          </button>
        </div>
      </form>

      {lessons.length === 0 ? (
        <Card>
          <CardDescription>לא נמצאו שיעורים.</CardDescription>
        </Card>
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {lessons.map((l) => (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold line-clamp-2">{l.title}</div>
                    <div className="text-xs text-ink-muted mt-1">
                      <Link
                        href={`/rabbi/${l.rabbi.slug}`}
                        className="hover:text-primary"
                      >
                        {l.rabbi.name}
                      </Link>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {dateFmt.format(l.scheduledAt)}
                    </div>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-paper-soft">
                        {BROADCAST_TYPES[l.broadcastType] || l.broadcastType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-paper-soft">
                        {LANGUAGES[l.language] || l.language}
                      </span>
                    </div>
                  </div>
                  <LessonDeleteButton id={l.id} />
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
                    <th className="p-3 font-medium">כותרת</th>
                    <th className="p-3 font-medium">רב</th>
                    <th className="p-3 font-medium">מועד</th>
                    <th className="p-3 font-medium">סוג</th>
                    <th className="p-3 font-medium">שפה</th>
                    <th className="p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-3 font-medium max-w-xs truncate">
                        {l.title}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/rabbi/${l.rabbi.slug}`}
                          className="hover:text-primary"
                        >
                          {l.rabbi.name}
                        </Link>
                      </td>
                      <td className="p-3 text-ink-muted whitespace-nowrap">
                        {dateFmt.format(l.scheduledAt)}
                      </td>
                      <td className="p-3">
                        {BROADCAST_TYPES[l.broadcastType] || l.broadcastType}
                      </td>
                      <td className="p-3">
                        {LANGUAGES[l.language] || l.language}
                      </td>
                      <td className="p-3">
                        <LessonDeleteButton id={l.id} />
                      </td>
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
