import {
  BookOpen,
  Heart,
  Moon,
  Scroll,
  Sparkles,
  Users,
  Music,
  Baby,
  Cake,
  HandHeart,
  Sunrise,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { broadcastTypeMeta, type BroadcastAccent } from "@/lib/enums";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Heart,
  Moon,
  Scroll,
  Sparkles,
  Users,
  Music,
  Baby,
  Cake,
  HandHeart,
  Sunrise,
  Flame,
};

export function broadcastIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BookOpen;
}

// מחלקות רכות (רקע+טקסט) ל-badges וקלפים לפי accent.
export const ACCENT_SOFT: Record<BroadcastAccent, string> = {
  primary: "bg-primary-soft text-primary",
  gold: "bg-gold-soft text-gold",
  live: "bg-live/10 text-live",
  danger: "bg-danger/10 text-danger",
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

// גבולות (למצב נבחר/hover) לפי accent.
export const ACCENT_BORDER: Record<BroadcastAccent, string> = {
  primary: "border-primary",
  gold: "border-gold",
  live: "border-live",
  danger: "border-danger",
  purple: "border-purple-500",
  emerald: "border-emerald-500",
};

// טקסט בלבד (לכותרות עם אקצנט).
export const ACCENT_TEXT: Record<BroadcastAccent, string> = {
  primary: "text-primary",
  gold: "text-gold",
  live: "text-live",
  danger: "text-danger",
  purple: "text-purple-700",
  emerald: "text-emerald-700",
};

export function BroadcastTypeBadge({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const meta = broadcastTypeMeta(value);
  if (meta.value === "LESSON") return null; // ברירת מחדל — לא מציגים badge
  const Icon = broadcastIcon(meta.icon);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ACCENT_SOFT[meta.accent]} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
