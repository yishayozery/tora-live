"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  badge?: number;
  /** "sidebar" — vertical (default) | "header" — horizontal */
  variant?: "sidebar" | "header";
  /** האם להחשיב התאמה רק על המסלול המדויק (default: false) */
  exact?: boolean;
};

export function NavLink({ href, children, badge, variant = "sidebar", exact = false }: Props) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  if (variant === "header") {
    return (
      <Link
        href={href}
        className={cn(
          "transition-colors relative",
          isActive ? "text-primary font-semibold" : "text-ink-soft hover:text-ink"
        )}
      >
        {children}
        {isActive && (
          <span className="absolute -bottom-[18px] left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition",
        isActive
          ? "bg-primary text-white shadow-sm"
          : "text-ink-soft hover:bg-paper-soft hover:text-ink"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="flex-1 inline-flex items-center gap-3">{children}</span>
      {badge && badge > 0 ? (
        <span className={cn(
          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold",
          isActive ? "bg-white text-primary" : "bg-danger text-white"
        )}>
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
