"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle, X, Send, BookOpen, Search, Calendar, Heart, HelpCircle,
  Radio, Sparkles, Settings, Mail, Phone
} from "lucide-react";

type Role = "guest" | "student" | "rabbi" | "admin";

type QuickAction = {
  label: string;
  icon: any;
  href: string;
  external?: boolean;
};

const ACTIONS_BY_ROLE: Record<Role, { greeting: string; actions: QuickAction[] }> = {
  guest: {
    greeting: "ברוכים הבאים ל-TORA_LIVE 🙏",
    actions: [
      { label: "חפש שיעור", icon: Search, href: "/lessons" },
      { label: "גלה רבנים", icon: BookOpen, href: "/rabbis" },
      { label: "הצטרף בחינם", icon: Sparkles, href: "/register" },
      { label: "אני רב — איך להירשם?", icon: Radio, href: "/rabbi/register" },
    ],
  },
  student: {
    greeting: "שלום! איך אפשר לעזור?",
    actions: [
      { label: "השיעורים שלי", icon: Calendar, href: "/my/schedule" },
      { label: "סימוניות", icon: BookOpen, href: "/my/bookmarks" },
      { label: "חפש שיעור", icon: Search, href: "/lessons" },
      { label: "התראות", icon: Sparkles, href: "/my/notifications" },
    ],
  },
  rabbi: {
    greeting: "שלום הרב! במה לעזור?",
    actions: [
      { label: "צור שיעור חדש", icon: BookOpen, href: "/dashboard/lessons/new" },
      { label: "התחל שידור חי", icon: Radio, href: "/dashboard/live" },
      { label: "פניות מתלמידים", icon: MessageCircle, href: "/dashboard/requests" },
      { label: "הגדרות החשבון", icon: Settings, href: "/dashboard/settings" },
    ],
  },
  admin: {
    greeting: "ניהול מערכת",
    actions: [
      { label: "הצעות חדשות", icon: Sparkles, href: "/admin/suggestions" },
      { label: "אירועים ושיעורים", icon: Calendar, href: "/admin/events" },
      { label: "רבנים", icon: BookOpen, href: "/admin/rabbis" },
      { label: "דיווחים", icon: HelpCircle, href: "/admin/reports" },
    ],
  },
};

const WHATSAPP_HREF = "https://wa.me/972500000000?text=שלום%2C%20אני%20צריך%20עזרה%20עם%20TORA_LIVE";

export function PersonalAssistant({ role = "guest", userName }: { role?: Role; userName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const config = ACTIONS_BY_ROLE[role];
  const filteredActions = search
    ? config.actions.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()))
    : config.actions;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "סגור עוזר" : "פתח עוזר אישי"}
        className={`fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full shadow-card transition-all flex items-center justify-center ${
          open
            ? "bg-ink text-white scale-90"
            : "bg-primary text-white hover:bg-primary-hover hover:scale-105 hover:shadow-soft"
        }`}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-live animate-pulse ring-2 ring-white" aria-hidden="true" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="עוזר אישי"
          className="fixed bottom-24 left-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[80vh] bg-white rounded-card border border-border shadow-card overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <header className="bg-gradient-to-l from-primary to-primary-hover text-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">העוזר של TORA_LIVE</h3>
                <p className="text-xs text-white/80 truncate">{config.greeting}{userName ? `, ${userName}` : ""}</p>
              </div>
            </div>
          </header>

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="מה אתה מחפש?"
                className="w-full h-10 pr-10 pl-3 rounded-btn border border-border bg-paper-soft text-sm focus:bg-white focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredActions.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-muted">
                לא נמצאו פעולות. <br />נסה: &quot;שיעור&quot;, &quot;רב&quot;, &quot;תרומה&quot;
              </div>
            ) : (
              filteredActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-btn hover:bg-paper-soft transition group"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary-soft text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm text-ink font-medium">{a.label}</span>
                    <span className="text-xs text-ink-muted group-hover:text-primary">←</span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer — direct contact */}
          <footer className="border-t border-border p-3 bg-paper-soft">
            <div className="text-xs text-ink-muted mb-2">צריך לדבר עם בן אדם?</div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-9 rounded-btn bg-[#25D366] text-white text-xs font-medium hover:opacity-90"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 h-9 rounded-btn bg-primary text-white text-xs font-medium hover:bg-primary-hover"
              >
                <Send className="w-3.5 h-3.5" />
                טופס
              </Link>
              <a
                href="mailto:info@tora-live.co.il"
                className="flex items-center justify-center gap-1.5 h-9 rounded-btn border border-border bg-white text-ink-soft text-xs font-medium hover:text-ink"
              >
                <Mail className="w-3.5 h-3.5" />
                מייל
              </a>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
