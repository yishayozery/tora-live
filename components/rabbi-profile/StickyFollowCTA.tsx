"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

// Mobile-only sticky bar that surfaces a "follow" prompt once the in-page hero
// CTAs have scrolled off-screen. Disappears once the user follows or scrolls back.
export function StickyFollowCTA({
  rabbiName,
  canFollow,
  initialFollowing,
  rabbiSlug,
}: {
  rabbiName: string;
  canFollow: boolean;
  initialFollowing: boolean;
  rabbiSlug: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (initialFollowing) return; // already following — never show
    const target = document.getElementById("hero-ctas");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setVisible(!e.isIntersecting);
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0 }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [initialFollowing]);

  if (initialFollowing) return null;

  return (
    <div
      className={
        "fixed inset-x-0 bottom-0 z-30 sm:hidden transition-transform duration-300 " +
        (visible ? "translate-y-0" : "translate-y-full pointer-events-none")
      }
      aria-hidden={!visible}
    >
      <div className="m-3 rounded-card border border-primary/30 bg-white shadow-soft p-3 flex items-center gap-3">
        <Heart className="w-5 h-5 text-primary shrink-0" aria-hidden />
        <div className="flex-1 min-w-0 text-sm text-ink truncate">
          עקוב אחר הרב {rabbiName}
        </div>
        {canFollow ? (
          <a
            href="#hero-ctas"
            className="inline-flex items-center h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
          >
            עקוב
          </a>
        ) : (
          <Link
            href={`/login?next=/rabbi/${rabbiSlug}`}
            className="inline-flex items-center h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
          >
            התחבר
          </Link>
        )}
      </div>
    </div>
  );
}
