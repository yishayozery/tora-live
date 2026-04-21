import Link from "next/link";
import { requireRabbi } from "@/lib/session";
import { BookOpen, LayoutDashboard, MessageSquare, Settings, Radio } from "lucide-react";
import { RabbiMobileNav } from "@/components/RabbiMobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Logo } from "@/components/Logo";

export default async function RabbiLayout({ children }: { children: React.ReactNode }) {
  const { rabbi } = await requireRabbi();

  return (
    <div className="min-h-screen bg-paper-soft md:flex">
      <RabbiMobileNav rabbiName={rabbi.name} />
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <div className="h-16 px-5 border-b border-border flex items-center hover:bg-paper-soft transition">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/dashboard" exact><LayoutDashboard className="w-4 h-4" /> דף ראשי</NavLink>
          <NavLink href="/dashboard/lessons"><BookOpen className="w-4 h-4" /> שיעורים</NavLink>
          <NavLink href="/dashboard/live"><Radio className="w-4 h-4" /> שידור חי</NavLink>
          <NavLink href="/dashboard/requests"><MessageSquare className="w-4 h-4" /> פניות</NavLink>
          <NavLink href="/dashboard/settings"><Settings className="w-4 h-4" /> הגדרות</NavLink>
        </nav>
        <div className="p-3 border-t border-border text-sm text-ink-muted">
          <div className="mb-2 truncate">שלום, {rabbi.name}</div>
          <LogoutButton label="יציאה" />
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 md:p-10">{children}</main>
    </div>
  );
}
