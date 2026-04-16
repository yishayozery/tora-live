"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Radio,
  ChevronDown,
} from "lucide-react";

type Props = {
  name: string | null;
  role: string | null;
};

export function UserMenu({ name, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initial = name?.charAt(0) ?? "?";
  const isRabbi = role === "RABBI";
  const isAdmin = role === "ADMIN";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-btn border border-border bg-white hover:bg-paper-soft transition text-sm"
        aria-label="תפריט משתמש"
      >
        <div className="w-7 h-7 rounded-full bg-primary-soft flex items-center justify-center text-primary text-xs font-bold">
          {initial}
        </div>
        <span className="hidden sm:inline text-ink font-medium max-w-[120px] truncate">{name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-12 w-56 bg-white border border-border rounded-card shadow-soft z-50 py-1">
          {/* שם ותפקיד */}
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-ink truncate">{name}</div>
            <div className="text-xs text-ink-muted">
              {isAdmin ? "אדמין" : isRabbi ? "רב" : "תלמיד"}
            </div>
          </div>

          {/* ניווט לפי תפקיד */}
          {isRabbi && (
            <>
              <MenuItem href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>דשבורד</MenuItem>
              <MenuItem href="/dashboard/live" icon={Radio} onClick={() => setOpen(false)}>שידור חי</MenuItem>
              <MenuItem href="/dashboard/settings" icon={Settings} onClick={() => setOpen(false)}>הגדרות הרב</MenuItem>
            </>
          )}
          {isAdmin && (
            <MenuItem href="/admin" icon={ShieldCheck} onClick={() => setOpen(false)}>ממשק אדמין</MenuItem>
          )}
          {!isRabbi && !isAdmin && (
            <>
              <MenuItem href="/my/schedule" icon={Calendar} onClick={() => setOpen(false)}>הלוח שלי</MenuItem>
              <MenuItem href="/my/profile" icon={User} onClick={() => setOpen(false)}>פרופיל</MenuItem>
            </>
          )}

          {/* התנתקות */}
          <div className="border-t border-border mt-1">
            <a
              href="/api/auth/signout"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition w-full"
              onClick={() => setOpen(false)}
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-paper-soft transition"
    >
      <Icon className="w-4 h-4 text-ink-muted" />
      {children}
    </Link>
  );
}
