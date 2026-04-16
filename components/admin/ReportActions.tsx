"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ReportActions({
  id,
  hasLesson,
}: {
  id: string;
  hasLesson: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "dismiss" | "removeLesson") {
    if (
      action === "removeLesson" &&
      !window.confirm("להסיר את השיעור ולסגור את הדיווח?")
    ) {
      return;
    }
    setBusy(true);
    await fetch(`/api/admin/reports/${id}`, {
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
        variant="secondary"
        disabled={busy}
        onClick={() => act("dismiss")}
      >
        סמן כנפתר
      </Button>
      {hasLesson && (
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={() => act("removeLesson")}
        >
          הסר שיעור + סגור
        </Button>
      )}
    </div>
  );
}
