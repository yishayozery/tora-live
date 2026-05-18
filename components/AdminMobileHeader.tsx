"use client";

// Header למובייל של אדמין — Logo + שם אדמין + hamburger לתפריט מלא + יציאה מהירה.
// מבוסס על מבנה דומה ל-RabbiMobileNav.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LogOut, ShieldCheck, Users, BookOpen, Flag, Heart,
  CalendarCheck, Youtube, Sparkles, Search,
} from "lucide-react";
import { Logo } from "@/components/Logo";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Users;
  badge?: number;
  exact?: boolean;
};

export function AdminMobileHeader({
  adminName,
  pendingEvents,
  pendingSuggestions,
  pendingCandidates,
}: {
  adminName: string;
  pendingEvents: number;
  pendingSuggestions: number;
  pendingCandidates: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/admin", label: "סקירה", icon: ShieldCheck, exact: true },
    { href: "/admin/rabbis", label: "רבנים", icon: Users },
    { href: "/admin/users", label: "תלמידים", icon: Users },
    { href: "/admin/lessons", label: "שיעורים", icon: BookOpen },
    { href: "/admin/events", label: "אירועים", icon: CalendarCheck, badge: pendingEvents },
    { href: "/admin/sources", label: "מקורות YouTube", icon: Youtube },
    { href: "/admin/sources/candidates", label: "מועמדים לסקירה", icon: Search, badge: pendingCandidates },
    { href: "/admin/suggestions", label: "הצעות מהרשת", icon: Sparkles, badge: pendingSuggestions },
    { href: "/admin/reports", label: "דיווחים", icon: Flag },
    { href: "/admin/donations", label: "תרומות", icon: Heart },
  ];

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-border">
        <div className="h-14 px-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-btn hover:bg-paper-soft"
            aria-label="פתח תפריט"
          >
            <Menu className="w-5 h-5 text-ink" />
          </button>
          <Logo size="sm" />
          <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full">אדמין</span>
          <div className="mr-auto flex items-center gap-2">
            <span className="text-xs text-ink-muted truncate max-w-[100px]">שלום, {adminName}</span>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white border-l border-border shadow-card transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="תפריט אדמין"
      >
        <div className="h-14 px-3 border-b border-border flex items-center justify-between">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-btn hover:bg-paper-soft"
            aria-label="סגור תפריט"
          >
            <X className="w-5 h-5 text-ink" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-btn text-sm transition ${
                  active ? "bg-primary text-white font-medium" : "text-ink-soft hover:bg-paper-soft"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{it.label}</span>
                {it.badge && it.badge > 0 ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/20" : "bg-gold/15 text-gold"}`}>
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-sm text-ink-muted mb-2 truncate">שלום, {adminName}</div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-danger hover:text-danger font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> התנתק
          </Link>
        </div>
      </aside>
    </>
  );
}
