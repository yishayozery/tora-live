"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type Props = {
  className?: string;
  /** "iconOnly" — קומפקטי. "full" — אייקון + טקסט (default) */
  variant?: "full" | "iconOnly";
  label?: string;
};

export function LogoutButton({ className = "", variant = "full", label = "התנתק" }: Props) {
  function handleClick() {
    if (!window.confirm("האם להתנתק מהחשבון?")) return;
    signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || "flex items-center gap-2 text-ink-muted hover:text-ink transition"}
    >
      <LogOut className="w-4 h-4" />
      {variant === "full" && <span>{label}</span>}
    </button>
  );
}
