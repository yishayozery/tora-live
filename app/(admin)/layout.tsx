import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { ShieldCheck, Users, BookOpen, Flag, Heart, CalendarCheck, Youtube, Sparkles } from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Logo } from "@/components/Logo";
import { PersonalAssistant } from "@/components/PersonalAssistant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  let pendingEvents = 0;
  let pendingSuggestions = 0;
  try {
    pendingEvents = await db.lesson.count({ where: { approvalStatus: "PENDING" } });
  } catch (e: any) {
    console.error("[admin/layout] lesson.count failed:", e?.message, e?.code);
  }
  try {
    pendingSuggestions = await db.lessonSuggestion.count({ where: { status: "PENDING" } });
  } catch (e: any) {
    console.error("[admin/layout] lessonSuggestion.count failed:", e?.message, e?.code);
  }
  return (
    <div className="min-h-screen bg-paper-soft flex">
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <div className="h-16 px-5 border-b border-border flex items-center justify-between hover:bg-paper-soft transition">
          <Logo size="sm" />
          <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full">אדמין</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin" exact><ShieldCheck className="w-4 h-4" /> סקירה</NavLink>
          <NavLink href="/admin/rabbis"><Users className="w-4 h-4" /> רבנים</NavLink>
          <NavLink href="/admin/users"><Users className="w-4 h-4" /> תלמידים</NavLink>
          <NavLink href="/admin/lessons"><BookOpen className="w-4 h-4" /> שיעורים</NavLink>
          <NavLink href="/admin/events" badge={pendingEvents}><CalendarCheck className="w-4 h-4" /> אירועים</NavLink>
          <NavLink href="/admin/sources"><Youtube className="w-4 h-4" /> מקורות YouTube</NavLink>
          <NavLink href="/admin/suggestions" badge={pendingSuggestions}><Sparkles className="w-4 h-4" /> הצעות מהרשת</NavLink>
          <NavLink href="/admin/reports"><Flag className="w-4 h-4" /> דיווחים</NavLink>
          <NavLink href="/admin/donations"><Heart className="w-4 h-4" /> תרומות</NavLink>
        </nav>
        <div className="p-3 border-t border-border text-sm">
          <LogoutButton label="יציאה" />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
      <PersonalAssistant role="admin" userName="אדמין" />
    </div>
  );
}
