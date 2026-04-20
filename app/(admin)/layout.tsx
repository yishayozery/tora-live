import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { ShieldCheck, Users, BookOpen, Flag, Heart, CalendarCheck, Youtube, Sparkles } from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pendingEvents = await db.lesson.count({ where: { approvalStatus: "PENDING" } });
  const pendingSuggestions = await db.lessonSuggestion.count({ where: { status: "PENDING" } });
  return (
    <div className="min-h-screen bg-paper-soft flex">
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <Link href="/" className="h-16 px-5 border-b border-border flex items-center gap-2 hover:bg-paper-soft transition">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="hebrew-serif text-xl font-bold text-ink">אדמין · TORA_LIVE</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin" icon={ShieldCheck} exact>סקירה</NavLink>
          <NavLink href="/admin/rabbis" icon={Users}>רבנים</NavLink>
          <NavLink href="/admin/users" icon={Users}>תלמידים</NavLink>
          <NavLink href="/admin/lessons" icon={BookOpen}>שיעורים</NavLink>
          <NavLink href="/admin/events" icon={CalendarCheck} badge={pendingEvents}>אירועים</NavLink>
          <NavLink href="/admin/sources" icon={Youtube}>מקורות YouTube</NavLink>
          <NavLink href="/admin/suggestions" icon={Sparkles} badge={pendingSuggestions}>הצעות מהרשת</NavLink>
          <NavLink href="/admin/reports" icon={Flag}>דיווחים</NavLink>
          <NavLink href="/admin/donations" icon={Heart}>תרומות</NavLink>
        </nav>
        <div className="p-3 border-t border-border text-sm">
          <LogoutButton label="יציאה" />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
