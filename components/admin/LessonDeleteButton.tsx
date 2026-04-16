"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function LessonDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("להסיר את השיעור? פעולה זו אינה הפיכה.")) return;
    setBusy(true);
    await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="danger" disabled={busy} onClick={remove}>
      הסר
    </Button>
  );
}
