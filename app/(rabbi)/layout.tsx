import Link from "next/link";
import { requireRabbi } from "@/lib/session";
import { BookOpen, LayoutDashboard, MessageSquare, Settings, LogOut, Radio } from "lucide-react";

export default async function RabbiLayout({ children }: { children: React.ReactNode }) {
  const { rabbi } = await requireRabbi();

  return (
    <div className="min-h-screen bg-paper-soft flex">
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <div className="h-16 px-5 border-b border-border flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="hebrew-serif text-xl font-bold">TORA_LIVE</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          <NavLink href="/dashboard" icon={LayoutDashboard}>דף ראשי</NavLink>
          <NavLink href="/dashboard/lessons" icon={BookOpen}>שיעורים</NavLink>
          <NavLink href="/dashboard/live" icon={Radio}>שידור חי</NavLink>
          <NavLink href="/dashboard/requests" icon={MessageSquare}>פניות</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>הגדרות</NavLink>
        </nav>
        <div className="p-3 border-t border-border text-sm text-ink-muted">
          <div className="mb-2 truncate">שלום, {rabbi.name}</div>
          <Link href="/api/auth/signout" className="flex items-center gap-2 hover:text-ink">
            <LogOut className="w-4 h-4" /> יציאה
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-btn text-ink-soft hover:bg-paper-soft hover:text-ink"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
}
