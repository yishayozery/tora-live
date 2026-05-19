import Link from "next/link";
import { requireRabbi } from "@/lib/session";
import { BookOpen, LayoutDashboard, MessageSquare, Settings, Radio, Archive, Users, Plus, Megaphone, Share2 } from "lucide-react";
import { RabbiMobileNav } from "@/components/RabbiMobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Logo } from "@/components/Logo";
import { PersonalAssistant } from "@/components/PersonalAssistant";
import { ActiveBroadcastBanner } from "@/components/ActiveBroadcastBanner";

export default async function RabbiLayout({ children }: { children: React.ReactNode }) {
  const { rabbi } = await requireRabbi();

  return (
    <div className="min-h-screen bg-paper-soft flex flex-col">
      {/* באנר חזרה לשידור פעיל — מוצג בראש העמוד אם הרב באמצע שידור */}
      <div className="sticky top-0 z-50">
        <ActiveBroadcastBanner rabbiId={rabbi.id} />
      </div>
      <div className="md:flex flex-1">
      <RabbiMobileNav rabbiName={rabbi.name} />
      <aside className="w-60 bg-white border-l border-border hidden md:flex flex-col">
        <div className="h-16 px-5 border-b border-border flex items-center hover:bg-paper-soft transition">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/dashboard" exact><LayoutDashboard className="w-4 h-4" /> לוח השיעורים שלי</NavLink>
          <NavLink href="/dashboard/lessons/new"><Plus className="w-4 h-4" /> הקמת שיעור</NavLink>
          <NavLink href="/dashboard/live"><Radio className="w-4 h-4" /> התחלת שיעור בשידור חי</NavLink>
          <NavLink href="/dashboard/lessons" exact><Archive className="w-4 h-4" /> ארכיון השיעורים</NavLink>
          <NavLink href="/dashboard/messages"><Megaphone className="w-4 h-4" /> הודעות לתלמידים</NavLink>
          <NavLink href="/dashboard/community"><Users className="w-4 h-4" /> הקהילה שלי</NavLink>
          <NavLink href="/dashboard/requests"><MessageSquare className="w-4 h-4" /> פניות</NavLink>
          <NavLink href="/dashboard/share-kit"><Share2 className="w-4 h-4" /> ערכת שיתוף</NavLink>
          <NavLink href="/dashboard/settings"><Settings className="w-4 h-4" /> הגדרות פרופיל</NavLink>
        </nav>
        <div className="p-3 border-t border-border text-sm text-ink-muted">
          <div className="mb-2 truncate">שלום, {rabbi.name}</div>
          <LogoutButton label="יציאה" />
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 md:p-10">{children}</main>
      <PersonalAssistant role="rabbi" userName={rabbi.name} />
      </div>
    </div>
  );
}
