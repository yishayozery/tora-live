// יצירת מוסד חדש + הקצאת רכז ראשון. אדמין בלבד.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "שם קצר מדי"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "סלאג באנגלית קטנה ומקפים בלבד"),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  // אימייל של הרכז הראשון — אם קיים כמשתמש, נשייך אותו
  rakazEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.institution.findUnique({ where: { slug: d.slug } });
  if (existing) {
    return NextResponse.json({ error: "סלאג כבר קיים" }, { status: 409 });
  }

  const institution = await db.institution.create({
    data: {
      name: d.name,
      slug: d.slug,
      city: d.city || null,
      address: d.address || null,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone || null,
    },
  });

  // הקצאת רכז ראשון אם האימייל תואם משתמש קיים
  let rakazAssigned = false;
  if (d.rakazEmail) {
    const user = await db.user.findUnique({ where: { email: d.rakazEmail.toLowerCase().trim() } });
    if (user) {
      await db.institutionMember.create({
        data: { institutionId: institution.id, userId: user.id, role: "RAKAZ" },
      });
      rakazAssigned = true;
    }
  }

  return NextResponse.json({ ok: true, id: institution.id, slug: institution.slug, rakazAssigned });
}

export async function GET() {
  await requireAdmin();
  const institutions = await db.institution.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rooms: true, members: true, lessons: true } } },
  });
  return NextResponse.json(institutions);
}
