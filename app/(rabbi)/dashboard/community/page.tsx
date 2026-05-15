import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { HelperToggle } from "@/components/HelperToggle";
import { formatHebrewDate } from "@/lib/utils";
import { Users, ShieldCheck, Search, Bell, BellOff, Eye, ExternalLink } from "lucide-react";

export const metadata = {
  title: "הקהילה שלי · TORA_LIVE",
  description: "ניהול עוקבים ועוזרי שידור",
};

type Props = {
  searchParams: { q?: string; filter?: "all" | "helpers" };
};

export default async function CommunityPage({ searchParams }: Props) {
  const { rabbi } = await requireApprovedRabbi();

  const q = searchParams.q?.trim() ?? "";
  const filter = searchParams.filter === "helpers" ? "helpers" : "all";

  const follows = await db.follow.findMany({
    where: {
      rabbiId: rabbi.id,
      ...(filter === "helpers" ? { isStreamHelper: true } as any : {}),
      ...(q
        ? {
            student: {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { user: { email: { contains: q, mode: "insensitive" as const } } },
              ],
            },
          }
        : {}),
    },
    include: {
      student: {
        select: {
          id: true, name: true, isBlocked: true,
          user: { select: { email: true } },
          bookmarks: {
            where: { lesson: { rabbiId: rabbi.id } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalFollows = await db.follow.count({ where: { rabbiId: rabbi.id } });
  const totalHelpers = await db.follow.count({ where: { rabbiId: rabbi.id, isStreamHelper: true } as any });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="hebrew-serif text-3xl font-bold">הקהילה שלי</h1>
        </div>
        <Link
          href={`/rabbi/${rabbi.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn border border-border bg-white text-ink-soft hover:border-primary hover:text-primary text-sm"
          title="פתח את הפרופיל הציבורי שלך כפי שתלמיד רואה אותו"
        >
          <Eye className="w-4 h-4" />
          תצוגת העמוד שלי כתלמיד
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink">{totalFollows}</div>
          <div className="text-xs text-ink-muted">עוקבים</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-gold">{totalHelpers}</div>
          <div className="text-xs text-ink-muted">עוזרי שידור</div>
        </Card>
        <Card className="text-center col-span-2 sm:col-span-1">
          <Link
            href="/dashboard/live"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            ניהול שידורים →
          </Link>
        </Card>
      </div>

      {/* Explainer */}
      <Card className="bg-gold/5 border-gold/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-ink mb-1">מה זה עוזר שידור?</div>
            <CardDescription>
              עוקב שאתה מסמן כעוזר יכול לפתוח את הלייב שלך בלי קוד וללא הצורך לפתוח אותו מהדשבורד שלך —
              כפתור "פתח שידור" יופיע לו ישירות בעמוד השיעור הציבורי בחלון הזמן של השיעור.
              שימושי לתלמיד שנמצא בכיתה ויודע לחבר את המצלמה/לפתוח Zoom.
            </CardDescription>
          </div>
        </div>
      </Card>

      {/* Search + filter */}
      <form className="flex flex-col sm:flex-row gap-2" action="/dashboard/community" method="get">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="חיפוש לפי שם / מייל"
            className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="filter"
            defaultValue={filter}
            className="h-11 px-3 rounded-btn border border-border bg-white text-sm"
          >
            <option value="all">כל העוקבים</option>
            <option value="helpers">רק עוזרי שידור</option>
          </select>
          <button
            type="submit"
            className="h-11 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
          >
            חפש
          </button>
        </div>
      </form>

      {/* List */}
      {follows.length === 0 ? (
        <Card>
          <CardDescription>
            {q || filter === "helpers"
              ? "לא נמצאו תוצאות. נסה שינוי חיפוש או סינון."
              : "עוד אין עוקבים. תלמידים שייכנסו לעמוד שלך ויעקבו — יופיעו כאן."}
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-2">
          {follows.map((f) => {
            const s = f.student;
            const bookmarksCount = s.bookmarks.length;
            const isHelper = (f as any).isStreamHelper === true;
            return (
              <Card key={f.id} className={isHelper ? "border-gold/40 bg-gold/5" : ""}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-ink">{s.name}</span>
                      {s.isBlocked && (
                        <span className="inline-flex items-center gap-1 text-xs text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                          חסום
                        </span>
                      )}
                      {isHelper && (
                        <span className="inline-flex items-center gap-1 text-xs text-gold bg-gold/15 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-3 h-3" /> עוזר שידור
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>הצטרף {formatHebrewDate(f.createdAt)}</span>
                      <span>· {bookmarksCount} שיעורים בלוח שלו</span>
                      <span className="inline-flex items-center gap-1">
                        {f.notifyOnNew ? (
                          <><Bell className="w-3 h-3" /> מקבל התראות</>
                        ) : (
                          <><BellOff className="w-3 h-3" /> ללא התראות</>
                        )}
                      </span>
                    </div>
                  </div>
                  {!s.isBlocked && (
                    <HelperToggle
                      followId={f.id}
                      initialIsHelper={isHelper}
                      studentName={s.name}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
