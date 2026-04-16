"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FollowButtonInline({
  rabbiId,
  initialFollowing,
}: {
  rabbiId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

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
        "h-8 px-3 inline-flex items-center gap-1.5 rounded-btn text-xs font-medium transition",
        following
          ? "bg-primary-soft text-primary border border-primary/20"
          : "bg-primary text-white hover:bg-primary-hover"
      )}
    >
      <Heart className={cn("w-3.5 h-3.5", following && "fill-current")} />
      {following ? "עוקב" : "עקוב"}
    </button>
  );
}
