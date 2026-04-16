import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, UserPlus } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  let userName: string | null = null;
  let userRole: string | null = null;
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, rabbi: { select: { name: true } }, student: { select: { name: true } } },
    });
    if (user) {
      userName = user.rabbi?.name ?? user.student?.name ?? session.user.name ?? null;
      userRole = user.role;
    }
  }

  const isLoggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-ink shrink-0">
          <BookOpen className="w-7 h-7 text-primary" />
          <span className="hebrew-serif text-2xl font-bold">TORA_LIVE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/rabbis" className="text-ink-soft hover:text-ink transition">רבנים</Link>
          <Link href="/lessons" className="text-ink-soft hover:text-ink transition">שיעורים</Link>
          {isLoggedIn && (
            <Link href="/my/schedule" className="text-ink-soft hover:text-ink transition">הלוח שלי</Link>
          )}
          <Link href="/donate" className="text-ink-soft hover:text-ink transition">תרומה</Link>
          <Link href="/contact" className="text-ink-soft hover:text-ink transition">צור קשר</Link>
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <UserMenu name={userName} role={userRole} />
            </>
          ) : (
            <>
              <Link
                href="/rabbi/register"
                className="h-10 px-4 hidden sm:inline-flex items-center gap-1.5 rounded-btn border border-gold/30 bg-gold-soft text-gold hover:bg-gold hover:text-white transition text-sm font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                הרשמת רב
              </Link>
              <Link
                href="/login"
                className="h-10 px-4 inline-flex items-center rounded-btn bg-primary text-white hover:bg-primary-hover text-sm font-semibold transition"
              >
                כניסה
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
