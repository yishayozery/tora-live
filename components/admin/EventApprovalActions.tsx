"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Check, X } from "lucide-react";

export function EventApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    if (action === "reject" && !window.confirm("לדחות את האירוע?")) return;
    setBusy(true);
    await fetch(`/api/admin/events/${id}`, {
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
        onClick={() => act("approve")}
      >
        <Check className="w-4 h-4" /> אשר
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={() => act("reject")}
      >
        <X className="w-4 h-4" /> דחה
      </Button>
    </div>
  );
}
