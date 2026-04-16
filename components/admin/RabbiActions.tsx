"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RabbiActions({
  id,
  status,
  blocked,
}: {
  id: string;
  status: string;
  blocked?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject" | "block" | "unblock") {
    setBusy(true);
    await fetch(`/api/admin/rabbis/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  }

  if (status === "PENDING") {
    return (
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="primary" disabled={busy} onClick={() => act("approve")}>אשר</Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={() => act("reject")}>דחה</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 shrink-0">
      {blocked ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act("unblock")}>שחרר חסימה</Button>
      ) : (
        <Button size="sm" variant="danger" disabled={busy} onClick={() => act("block")}>חסום</Button>
      )}
    </div>
  );
}
