import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { UserActions } from "@/components/admin/UserActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();

  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = { role: "STUDENT" };
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { student: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  let total = 0;
  let users: any[] = [];
  let loadError: string | null = null;

  try {
    const [t, u] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        include: {
          student: {
            include: {
              _count: { select: { follows: true, chatMessages: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
    ]);
    total = t;
    users = u;
  } catch (err: any) {
    console.error("[admin/users] Query failed:", err);
    loadError = err?.message || "Unknown error";
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fmt = new Intl.NumberFormat("he-IL");
  const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "short" });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="hebrew-serif text-3xl font-bold">תלמידים</h1>
        <div className="text-sm text-ink-muted">סה"כ {fmt.format(total)}</div>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="חיפוש לפי שם או מייל"
          className="flex-1 h-11 px-4 rounded-btn border border-border bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          className="h-11 px-5 rounded-btn bg-primary text-white font-medium"
        >
          חפש
        </button>
      </form>

      {loadError ? (
        <Card className="border-danger/40 bg-danger/5">
          <div className="space-y-2">
            <h3 className="font-bold text-danger">שגיאה בטעינת תלמידים</h3>
            <p className="text-sm text-ink-soft">קוד: {loadError}</p>
            <p className="text-xs text-ink-muted">
              זו ככל הנראה בעיה בשאילתה או ב-DB schema. בדוק Vercel Logs לפרטים.
            </p>
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardDescription>לא נמצאו תלמידים.</CardDescription>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => {
              const s = u.student;
              return (
                <Card key={u.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{s?.name || "—"}</div>
                      <div className="text-xs text-ink-muted truncate" dir="ltr">
                        {u.email}
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        נרשם: {dateFmt.format(u.createdAt)}
                      </div>
                      <div className="text-xs text-ink-muted">
                        עוקב אחרי {fmt.format(s?._count.follows ?? 0)} רבנים · {fmt.format(s?._count.chatMessages ?? 0)} שאלות
                      </div>
                      <div className="mt-2">
                        {s?.isBlocked ? (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                            חסום{s.blockedReason ? ` · ${s.blockedReason}` : ""}
                          </span>
                        ) : (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-live/10 text-live">
                            פעיל
                          </span>
                        )}
                      </div>
                    </div>
                    {s && (
                      <UserActions
                        id={u.id}
                        blocked={s.isBlocked}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-paper-soft text-ink-muted text-right">
                  <tr>
                    <th className="p-3 font-medium">שם</th>
                    <th className="p-3 font-medium">מייל</th>
                    <th className="p-3 font-medium">נרשם</th>
                    <th className="p-3 font-medium">עוקב</th>
                    <th className="p-3 font-medium">שאלות</th>
                    <th className="p-3 font-medium">סטטוס</th>
                    <th className="p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const s = u.student;
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="p-3 font-medium">{s?.name || "—"}</td>
                        <td className="p-3 text-ink-muted" dir="ltr">
                          {u.email}
                        </td>
                        <td className="p-3 text-ink-muted">
                          {dateFmt.format(u.createdAt)}
                        </td>
                        <td className="p-3">{fmt.format(s?._count.follows ?? 0)}</td>
                        <td className="p-3">{fmt.format(s?._count.chatMessages ?? 0)}</td>
                        <td className="p-3">
                          {s?.isBlocked ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger"
                              title={s.blockedReason || ""}
                            >
                              חסום
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-live/10 text-live">
                              פעיל
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {s && <UserActions id={u.id} blocked={s.isBlocked} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-ink-muted">
                עמוד {fmt.format(page)} מתוך {fmt.format(totalPages)}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}
                    className="h-9 px-3 rounded-btn border border-border bg-white inline-flex items-center"
                  >
                    הקודם
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}
                    className="h-9 px-3 rounded-btn border border-border bg-white inline-flex items-center"
                  >
                    הבא
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
