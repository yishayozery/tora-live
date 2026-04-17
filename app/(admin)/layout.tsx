import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { ShieldCheck, Users, BookOpen, Flag, Heart, LogOut, CalendarCheck } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pendingEvents = await db.lesson.count({ where: { approvalStatus: "PENDING" } });
  return (
    <div className="min-h-screen bg-paper-soft flex">
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <div className="h-16 px-5 border-b border-border flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="hebrew-serif text-xl font-bold">אדמין</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          <A href="/admin" icon={ShieldCheck}>סקירה</A>
          <A href="/admin/rabbis" icon={Users}>רבנים</A>
          <A href="/admin/users" icon={Users}>תלמידים</A>
          <A href="/admin/lessons" icon={BookOpen}>שיעורים</A>
          <A href="/admin/events" icon={CalendarCheck} badge={pendingEvents}>אירועים</A>
          <A href="/admin/reports" icon={Flag}>דיווחים</A>
          <A href="/admin/donations" icon={Heart}>תרומות</A>
        </nav>
        <div className="p-3 border-t border-border text-sm">
          <Link href="/api/auth/signout" className="flex items-center gap-2 text-ink-muted hover:text-ink">
            <LogOut className="w-4 h-4" /> יציאה
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

function A({ href, icon: Icon, badge, children }: { href: string; icon: any; badge?: number; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-btn text-ink-soft hover:bg-paper-soft hover:text-ink">
      <Icon className="w-4 h-4" />
      <span className="flex-1">{children}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-white text-[11px] font-bold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
