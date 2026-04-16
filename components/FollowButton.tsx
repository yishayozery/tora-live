"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FollowButton({
  rabbiId,
  initialFollowing,
  canFollow,
}: {
  rabbiId: string;
  initialFollowing: boolean;
  canFollow: boolean; // תלמיד מחובר, לא חסום
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  if (!canFollow) {
    return (
      <a
        href="/login"
        className="h-10 px-4 inline-flex items-center gap-2 rounded-btn border border-border bg-white text-ink-soft text-sm"
      >
        <Heart className="w-4 h-4" /> התחבר כדי לעקוב
      </a>
    );
  }

  function toggle() {
    start(async () => {
      const res = await fetch(`/api/follow/${rabbiId}`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowing(!following);
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "h-10 px-4 inline-flex items-center gap-2 rounded-btn text-sm font-medium transition",
        following
          ? "bg-primary-soft text-primary border border-primary/20"
          : "bg-primary text-white hover:bg-primary-hover"
      )}
    >
      <Heart className={cn("w-4 h-4", following && "fill-current")} />
      {following ? "עוקב" : "עקוב"}
    </button>
  );
}
