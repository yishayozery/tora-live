"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, LayoutDashboard, MessageSquare, Settings, LogOut, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "דף ראשי" },
  { href: "/dashboard/lessons", icon: BookOpen, label: "שיעורים" },
  { href: "/dashboard/live", icon: Radio, label: "שידור חי" },
  { href: "/dashboard/requests", icon: MessageSquare, label: "פניות" },
  { href: "/dashboard/settings", icon: Settings, label: "הגדרות" },
];

export function RabbiMobileNav({ rabbiName }: { rabbiName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // סגירה אוטומטית בשינוי מסך
  useEffect(() => { setOpen(false); }, [pathname]);

  // נעילת סקרול ברקע כשפתוח
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // שם הטאב הנוכחי בכותרת
  const currentLabel = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "TORA_LIVE";

  return (
    <>
      {/* כותרת מובייל קבועה */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 hover:bg-paper-soft rounded-btn"
          aria-label="תפריט"
        >
          <Menu className="w-5 h-5 text-ink" />
        </button>
        <BookOpen className="w-5 h-5 text-primary" />
        <span className="hebrew-serif text-lg font-bold flex-1 truncate">{currentLabel}</span>
      </header>

      {/* רקע כהה */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* תפריט נשלף */}
      <aside
        className={cn(
          "md:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="hebrew-serif text-lg font-bold">TORA_LIVE</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-paper-soft rounded-btn" aria-label="סגור">
            <X className="w-5 h-5 text-ink" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-btn text-base transition",
                  active
                    ? "bg-primary text-white font-semibold"
                    : "text-ink-soft hover:bg-paper-soft hover:text-ink"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-sm text-ink-muted mb-2 truncate">שלום, {rabbiName}</div>
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
