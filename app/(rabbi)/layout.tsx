import Link from "next/link";
import { requireRabbi } from "@/lib/session";
import { BookOpen, LayoutDashboard, MessageSquare, Settings, Radio } from "lucide-react";
import { RabbiMobileNav } from "@/components/RabbiMobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function RabbiLayout({ children }: { children: React.ReactNode }) {
  const { rabbi } = await requireRabbi();

  return (
    <div className="min-h-screen bg-paper-soft md:flex">
      <RabbiMobileNav rabbiName={rabbi.name} />
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <Link href="/" className="h-16 px-5 border-b border-border flex items-center gap-2 hover:bg-paper-soft transition">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="hebrew-serif text-xl font-bold text-ink">TORA_LIVE</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/dashboard" icon={LayoutDashboard} exact>דף ראשי</NavLink>
          <NavLink href="/dashboard/lessons" icon={BookOpen}>שיעורים</NavLink>
          <NavLink href="/dashboard/live" icon={Radio}>שידור חי</NavLink>
          <NavLink href="/dashboard/requests" icon={MessageSquare}>פניות</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>הגדרות</NavLink>
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
