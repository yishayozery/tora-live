import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { db } from "./db";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRabbi() {
  const session = await requireSession();
  if (session.user.role !== "RABBI") redirect("/");
  const rabbi = await db.rabbi.findUnique({ where: { userId: session.user.id } });
  if (!rabbi) redirect("/");
  return { session, rabbi };
}

export async function requireApprovedRabbi() {
  const { session, rabbi } = await requireRabbi();
  if (rabbi.status !== "APPROVED") redirect("/dashboard/pending");
  if (rabbi.isBlocked) redirect("/blocked");
  return { session, rabbi };
}

export async function requireAdmin() {
  const session = await requireSession();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()?.trim();
  const userEmail = session.user?.email?.toLowerCase()?.trim();
  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    redirect("/");
  }
  return session;
}

/**
 * מאמת שהמשתמש הוא רכז (RAKAZ) של המוסד הנתון.
 * מחזיר את ה-session, ה-institution וה-membership.
 * אם לא רכז — redirect.
 */
export async function requireRakaz(institutionSlug: string) {
  const session = await requireSession();
  const institution = await db.institution.findUnique({
    where: { slug: institutionSlug },
  });
  if (!institution) redirect("/");

  // אדמין-על תמיד יכול. אחרת — חייב membership עם role=RAKAZ.
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()?.trim();
  const isSuperAdmin = !!adminEmail && session.user?.email?.toLowerCase()?.trim() === adminEmail;

  const membership = await db.institutionMember.findUnique({
    where: { institutionId_userId: { institutionId: institution.id, userId: session.user.id } },
  });

  if (!isSuperAdmin && (!membership || membership.role !== "RAKAZ")) {
    redirect("/");
  }
  return { session, institution, membership, isSuperAdmin };
}
