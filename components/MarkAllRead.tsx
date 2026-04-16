"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MarkAllRead() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await fetch("/api/me/notifications", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
          router.refresh();
        })
      }
      disabled={pending}
      className="text-sm text-primary hover:underline"
    >
      סמן הכל כנקרא
    </button>
  );
}
