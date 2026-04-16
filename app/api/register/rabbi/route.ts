import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rabbiRegisterSchema } from "@/lib/validators";
import { slugify, uniqueSlug } from "@/lib/slugify";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = rabbiRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password, name, phone } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    return NextResponse.json({ error: "מייל זה כבר רשום" }, { status: 409 });
  }

  // slug אוטומטי — הרב יוכל לערוך אחרי אישור
  const baseSlug = slugify(name);
  const slug = await uniqueSlug(baseSlug, async (s) => {
    const exists = await db.rabbi.findUnique({ where: { slug: s } });
    return !!exists;
  });

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role: "RABBI",
      rabbi: {
        create: {
          name,
          slug,
          phone: phone || null,
          bio: "",
          status: "PENDING",
          profileCompleted: false,
        },
      },
    },
  });

  // TODO: מייל לאדמין על בקשה חדשה
  return NextResponse.json({ ok: true });
}
