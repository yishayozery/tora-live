// ניהול חברי המוסד — רכז בלבד.
import Link from "next/link";
import { requireRakaz } from "@/lib/session";
import { db } from "@/lib/db";
import { AddMemberForm } from "@/components/institution/AddMemberForm";
import { RemoveMemberButton } from "@/components/institution/RemoveMemberButton";
import { Card, CardDescription } from "@/components/ui/Card";
import { ChevronRight, Users, Shield, BookOpen, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ניהול חברים | TORA_LIVE",
};

type Role = "RAKAZ" | "RABBI" | "VIEWER";

export default async function InstitutionMembersPage({
  params,
}: {
  params: { slug: string };
}) {
  const { session, institution } = await requireRakaz(params.slug);

  const members = await db.institutionMember.findMany({
    where: { institutionId: institution.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          rabbi: { select: { name: true, slug: true } },
          student: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const currentUserId = session.user.id;

  return (
    <div className="min-h-screen bg-paper-soft">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* breadcrumb */}
        <nav className="text-sm text-ink-muted flex items-center gap-1">
          <Link
            href={`/dashboard/institution/${institution.slug}`}
            className="hover:text-ink inline-flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            {institution.name}
          </Link>
        </nav>

        {/* header */}
        <header>
          <div className="text-sm text-ink-muted">ישיבת {institution.name}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight mt-1">
            ניהול חברי הישיבה
          </h1>
          <p className="mt-2 text-ink-soft">
            הוספת רכזים ורבנים. רק רכזים יכולים לערוך את הישיבה.
          </p>
        </header>

        {/* add member form */}
        <AddMemberForm slug={institution.slug} />

        {/* members table */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-ink">
              חברי הישיבה
            </h2>
            <span className="text-sm text-ink-muted">({members.length})</span>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardDescription>אין עדיין חברים. הוסף את הרב הראשון.</CardDescription>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {/* desktop table */}
              <table className="w-full hidden sm:table">
                <thead className="bg-paper-soft/60 border-b border-border">
                  <tr>
                    <th className="text-start text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">
                      שם / אימייל
                    </th>
                    <th className="text-start text-xs font-semibold text-ink-muted uppercase tracking-wider px-4 py-3">
                      תפקיד
                    </th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const name =
                      m.user.rabbi?.name ?? m.user.student?.name ?? null;
                    const label = name ?? m.user.email;
                    const isSelf = m.user.id === currentUserId;
                    return (
                      <tr key={m.id} className="hover:bg-paper-soft/40">
                        <td className="px-4 py-3 align-middle">
                          <MemberName
                            name={name}
                            email={m.user.email}
                            rabbiSlug={m.user.rabbi?.slug ?? null}
                          />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <RoleBadge role={m.role as Role} />
                        </td>
                        <td className="px-4 py-3 align-middle text-end">
                          {!isSelf && (
                            <RemoveMemberButton
                              slug={institution.slug}
                              memberId={m.id}
                              memberLabel={label}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* mobile cards */}
              <ul className="sm:hidden divide-y divide-border">
                {members.map((m) => {
                  const name =
                    m.user.rabbi?.name ?? m.user.student?.name ?? null;
                  const label = name ?? m.user.email;
                  const isSelf = m.user.id === currentUserId;
                  return (
                    <li key={m.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <MemberName
                            name={name}
                            email={m.user.email}
                            rabbiSlug={m.user.rabbi?.slug ?? null}
                          />
                          <div className="mt-1.5">
                            <RoleBadge role={m.role as Role} />
                          </div>
                        </div>
                        {!isSelf && (
                          <RemoveMemberButton
                            slug={institution.slug}
                            memberId={m.id}
                            memberLabel={label}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

function MemberName({
  name,
  email,
  rabbiSlug,
}: {
  name: string | null;
  email: string;
  rabbiSlug: string | null;
}) {
  if (name && rabbiSlug) {
    return (
      <div>
        <Link
          href={`/rabbi/${rabbiSlug}`}
          className="font-semibold text-ink hover:text-primary hover:underline"
        >
          {name}
        </Link>
        <div className="text-xs text-ink-muted truncate" dir="ltr">
          {email}
        </div>
      </div>
    );
  }
  if (name) {
    return (
      <div>
        <div className="font-semibold text-ink">{name}</div>
        <div className="text-xs text-ink-muted truncate" dir="ltr">
          {email}
        </div>
      </div>
    );
  }
  return (
    <div className="font-mono text-sm text-ink truncate" dir="ltr">
      {email}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "RAKAZ") {
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-gold/10 text-gold border border-gold/30 text-xs font-semibold">
        <Shield className="w-3 h-3" />
        רכז
      </span>
    );
  }
  if (role === "RABBI") {
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-semibold">
        <BookOpen className="w-3 h-3" />
        רב
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-ink-muted/10 text-ink-muted border border-border text-xs font-semibold">
      <Eye className="w-3 h-3" />
      צופה
    </span>
  );
}
