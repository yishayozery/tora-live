import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";

// GET — רשימת קטגוריות של הרב
export async function GET() {
  const { rabbi } = await requireApprovedRabbi();
  const categories = await db.category.findMany({
    where: { rabbiId: rabbi.id },
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });
  return NextResponse.json(
    categories.map((c) => ({ id: c.id, name: c.name, order: c.order, lessonsCount: c._count.lessons }))
  );
}

// POST — יצירת קטגוריה חדשה
const createSchema = z.object({ name: z.string().min(2, "שם קצר מדי").max(50) });

export async function POST(req: Request) {
  const { rabbi } = await requireApprovedRabbi();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const name = parsed.data.name.trim();

  // בדיקת כפילות
  const existing = await db.category.findFirst({ where: { rabbiId: rabbi.id, name } });
  if (existing) return NextResponse.json({ error: "קטגוריה בשם זה כבר קיימת" }, { status: 409 });

  // קביעת order — אחרון
  const last = await db.category.findFirst({ where: { rabbiId: rabbi.id }, orderBy: { order: "desc" } });
  const order = (last?.order ?? 0) + 1;

  const cat = await db.category.create({
    data: { rabbiId: rabbi.id, name, order },
  });
  return NextResponse.json({ id: cat.id, name: cat.name, order: cat.order, lessonsCount: 0 });
}
