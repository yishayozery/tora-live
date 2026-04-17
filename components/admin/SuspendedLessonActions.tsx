"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SuspendedLessonActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "unsuspend" | "resetCount") {
    if (
      action === "resetCount" &&
      !window.confirm("לאפס את ספירת הדיווחים לשיעור זה?")
    )
      return;
    setBusy(true);
    await fetch(`/api/admin/lessons/${id}/unsuspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0 flex-wrap">
      <Button
        size="sm"
        className="bg-live text-white hover:opacity-90"
        disabled={busy}
        onClick={() => act("unsuspend")}
      >
        בטל השהיה
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => act("resetCount")}
      >
        אפס דיווחים
      </Button>
    </div>
  );
}
