import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { mediaLinksSchema } from "@/lib/validators";

const updateSchema = z.object({
  bio: z.string().min(20, "תיאור קצר מדי — לפחות 20 תווים").max(2000),
  slug: z
    .string()
    .min(3, "כתובת קצרה מדי")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "כתובת באנגלית באותיות קטנות ומקפים בלבד")
    .optional(),
  // תמונת פרופיל — base64 data URL או URL רגיל. אורך מקסימום ~1MB base64
  photoUrl: z.string().max(2_000_000).nullable().optional(),
  media: mediaLinksSchema.optional(),
  liveMode: z.enum(["OWN", "PLATFORM"]).optional(),
  autoReplyEnabled: z.boolean().optional(),
  autoReplyMessage: z.string().max(2000).optional(),
});

export async function PUT(req: Request) {
  const { rabbi } = await requireRabbi();
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { bio, slug, photoUrl, media, liveMode, autoReplyEnabled, autoReplyMessage } =
    parsed.data;

  // אימות slug ייחודי אם השתנה
  if (slug && slug !== rabbi.slug) {
    const taken = await db.rabbi.findFirst({ where: { slug, NOT: { id: rabbi.id } } });
    if (taken) return NextResponse.json({ error: "כתובת זו תפוסה" }, { status: 409 });
  }

  // ניקוי ערכים ריקים מה-media לפני שמירה
  const cleanMedia = media
    ? Object.fromEntries(Object.entries(media).filter(([, v]) => v))
    : null;

  const data: any = {
    bio,
    ...(slug ? { slug } : {}),
    ...(photoUrl !== undefined ? { photoUrl } : {}),
    mediaLinks: cleanMedia && Object.keys(cleanMedia).length ? JSON.stringify(cleanMedia) : null,
    ...(liveMode ? { liveMode } : {}),
    profileCompleted: bio.length >= 20 && !!photoUrl,
  };
  if (typeof autoReplyEnabled === "boolean") {
    data.autoReplyEnabled = autoReplyEnabled;
  }
  if (typeof autoReplyMessage === "string") {
    data.autoReplyMessage = autoReplyMessage.trim() || null;
  }
  await db.rabbi.update({ where: { id: rabbi.id }, data });

  return NextResponse.json({ ok: true });
}
