// ניהול חברי מוסד — הוספת רב/רכז + רשימה. רכז בלבד.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRakazOf } from "@/lib/institution";

const schema = z.object({
  email: z.string().email("אימייל לא תקין"),
  role: z.enum(["RAKAZ", "RABBI", "VIEWER"]).default("RABBI"),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const institution = await db.institution.findUnique({ where: { slug: params.slug } });
  if (!institution) return NextResponse.json({ error: "מוסד לא נמצא" }, { status: 404 });
  if (!(await isRakazOf(session.user.id, institution.id, session.user.email))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: "אין משתמש עם האימייל הזה. שיירשם תחילה." }, { status: 404 });
  }

  const member = await db.institutionMember.upsert({
    where: { institutionId_userId: { institutionId: institution.id, userId: user.id } },
    create: { institutionId: institution.id, userId: user.id, role: parsed.data.role },
    update: { role: parsed.data.role },
  });
  return NextResponse.json({ ok: true, memberId: member.id, role: member.role });
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });

  const institution = await db.institution.findUnique({ where: { slug: params.slug } });
  if (!institution) return NextResponse.json({ error: "מוסד לא נמצא" }, { status: 404 });
  if (!(await isRakazOf(session.user.id, institution.id, session.user.email))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const members = await db.institutionMember.findMany({
    where: { institutionId: institution.id },
    include: {
      user: { select: { email: true, rabbi: { select: { name: true, slug: true } }, student: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  // לא חושפים כלום רגיש מעבר לאימייל (שהרכז ממילא הקליד)
  return NextResponse.json(members.map((m) => ({
    id: m.id,
    role: m.role,
    email: m.user.email,
    name: m.user.rabbi?.name ?? m.user.student?.name ?? null,
    rabbiSlug: m.user.rabbi?.slug ?? null,
  })));
}
