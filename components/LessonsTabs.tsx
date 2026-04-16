"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, History } from "lucide-react";

type Tab = "upcoming" | "past";

export function LessonsTabs({
  upcoming,
  past,
  upcomingCount,
  pastCount,
}: {
  upcoming: React.ReactNode;
  past: React.ReactNode;
  upcomingCount: number;
  pastCount: number;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-5">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          <Calendar className="w-4 h-4" />
          קרובים
          <span className="text-xs text-ink-muted">({upcomingCount})</span>
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          <History className="w-4 h-4" />
          שיעורים שמסרתי
          <span className="text-xs text-ink-muted">({pastCount})</span>
        </TabButton>
      </div>

      {tab === "upcoming" ? upcoming : past}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition -mb-px",
        active
          ? "border-primary text-primary font-semibold"
          : "border-transparent text-ink-muted hover:text-ink hover:border-border"
      )}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  );
}
