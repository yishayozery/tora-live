import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PersonalAssistant } from "@/components/PersonalAssistant";

type Role = "guest" | "student" | "rabbi" | "admin";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  let role: Role = "guest";
  let userName: string | null = null;

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true, rabbi: { select: { name: true } }, student: { select: { name: true } } },
    });
    if (user) {
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()?.trim();
      if (user.email?.toLowerCase() === adminEmail || user.role === "ADMIN") role = "admin";
      else if (user.role === "RABBI") role = "rabbi";
      else role = "student";
      userName = user.rabbi?.name ?? user.student?.name ?? null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper-soft">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <PersonalAssistant role={role} userName={userName} />
    </div>
  );
}
