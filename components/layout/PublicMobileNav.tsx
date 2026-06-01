"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, Users, Calendar, Heart, Phone, UserPlus, LogIn, HandHeart, Sparkles, Radio, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLoggedIn: boolean;
  isRabbi: boolean;
};

export function PublicMobileNav({ isLoggedIn, isRabbi }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const items = [
    // המיקוד: שיעורים חיים → לוח → ארכיון → רבנים
    { href: "/#live", icon: Radio, label: "שידור חי" },
    { href: "/#calendar", icon: Calendar, label: "לוח שיעורים" },
    { href: "/lessons", icon: Archive, label: "ארכיון השיעורים" },
    { href: "/rabbis", icon: Users, label: "רבנים" },
    ...(isLoggedIn && !isRabbi ? [{ href: "/my/schedule", icon: BookOpen, label: "הלוח שלי" }] : []),
    ...(isLoggedIn ? [{ href: "/propose-event", icon: Sparkles, label: "הצעת יום עיון" }] : []),
    { href: "/donate", icon: HandHeart, label: "תרומה" },
    { href: "/contact", icon: Phone, label: "צור קשר" },
  ];

  return (
    <>
      {/* hamburger button — visible on mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center w-11 h-11 -ml-2 rounded-btn hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="פתח תפריט"
      >
        <Menu className="w-6 h-6 text-ink" />
      </button>

      {/* backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="hebrew-serif text-lg font-bold">TANA</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-paper-soft rounded-btn" aria-label="סגור">
            <X className="w-5 h-5 text-ink" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
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

        {!isLoggedIn && (
          <div className="p-4 border-t border-border space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 h-11 rounded-btn bg-primary text-white hover:bg-primary-hover font-semibold"
            >
              <LogIn className="w-4 h-4" /> כניסה
            </Link>
            <Link
              href="/rabbi/register"
              className="flex items-center justify-center gap-2 h-11 rounded-btn border border-gold/30 bg-gold-soft text-gold hover:bg-gold hover:text-white font-semibold"
            >
              <UserPlus className="w-4 h-4" /> הרשמת רב
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
