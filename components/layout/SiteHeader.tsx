import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserPlus, LayoutDashboard, ShieldCheck, Globe } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { Logo } from "@/components/Logo";

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
        <div className="flex items-center gap-2">
          <PublicMobileNav isLoggedIn={isLoggedIn} isRabbi={userRole === "RABBI"} />
          <Logo size="md" />
        </div>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          {userRole === "RABBI" ? (
            // רב מחובר — תפריט מקוצר עם קישורים פנימיים שלו
            <>
              <NavLink href="/dashboard/lessons" variant="header">השיעורים שלי</NavLink>
              <NavLink href="/dashboard/live" variant="header">שידור חי</NavLink>
              <NavLink href="/dashboard/requests" variant="header">פניות</NavLink>
              <NavLink href="/lessons" variant="header">דפדף בשיעורים</NavLink>
            </>
          ) : userRole === "ADMIN" ? (
            // אדמין — קישורים מהירים פנימיים
            <>
              <NavLink href="/admin/suggestions" variant="header">הצעות</NavLink>
              <NavLink href="/admin/lessons" variant="header">שיעורים</NavLink>
              <NavLink href="/admin/rabbis" variant="header">רבנים</NavLink>
              <NavLink href="/lessons" variant="header">צד ציבורי</NavLink>
            </>
          ) : (
            // אורח / תלמיד — תפריט ציבורי מלא
            <>
              <NavLink href="/rabbis" variant="header">רבנים</NavLink>
              <NavLink href="/lessons" variant="header">שיעורים</NavLink>
              {isLoggedIn && (
                <NavLink href="/my/schedule" variant="header">הלוח שלי</NavLink>
              )}
              {isLoggedIn && (
                <NavLink href="/propose-event" variant="header">
                  <span className="text-gold hover:text-gold/80 font-medium">הצעת יום עיון</span>
                </NavLink>
              )}
              <NavLink href="/donate" variant="header">תרומה</NavLink>
              <NavLink href="/contact" variant="header">צור קשר</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* English toggle — תמיד גלוי */}
          <Link
            href="/en"
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-btn border border-border bg-paper-soft text-ink-soft hover:border-primary hover:text-primary transition text-xs font-medium"
            aria-label="Switch to English"
            title="English"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EN</span>
          </Link>
          {isLoggedIn ? (
            <>
              {/* קיצור דרך לדשבורד עבור רב/אדמין — תמיד גלוי */}
              {userRole === "RABBI" && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-btn bg-primary text-white hover:bg-primary-hover text-sm font-semibold transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  לדשבורד
                </Link>
              )}
              {userRole === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-btn bg-primary text-white hover:bg-primary-hover text-sm font-semibold transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  אדמין
                </Link>
              )}
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
