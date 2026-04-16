"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function UserActions({ id, blocked }: { id: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function block() {
    const reason = window.prompt("סיבת חסימה (לא חובה):") ?? undefined;
    if (reason === null) return;
    setBusy(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "block", reason: reason || undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  async function unblock() {
    setBusy(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unblock" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      {blocked ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={unblock}>
          שחרר חסימה
        </Button>
      ) : (
        <Button size="sm" variant="danger" disabled={busy} onClick={block}>
          חסום
        </Button>
      )}
    </div>
  );
}
