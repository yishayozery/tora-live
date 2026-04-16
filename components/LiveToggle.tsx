"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Radio, Square } from "lucide-react";

export function LiveToggle({
  lessonId,
  initialLive,
  initialUrl,
}: {
  lessonId: string;
  initialLive: boolean;
  initialUrl: string;
}) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(initialLive);
  const [url, setUrl] = useState(initialUrl);
  const [showInput, setShowInput] = useState(false);
  const [pending, start] = useTransition();

  function startBroadcast() {
    if (!url.trim()) {
      setShowInput(true);
      return;
    }
    start(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: true, liveEmbedUrl: url }),
      });
      if (res.ok) {
        setIsLive(true);
        setShowInput(false);
        router.refresh();
      }
    });
  }

  function stopBroadcast() {
    start(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false }),
      });
      if (res.ok) {
        setIsLive(false);
        router.refresh();
      }
    });
  }

  if (isLive) {
    return (
      <Button variant="danger" size="sm" onClick={stopBroadcast} disabled={pending}>
        <Square className="w-3.5 h-3.5" />
        {pending ? "מסיים..." : "סיים שידור"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-end shrink-0">
      {showInput && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="הדבק לינק YouTube / Zoom"
          className="h-9 px-3 w-64 rounded-btn border border-border bg-white text-sm" dir="ltr"
          autoFocus
        />
      )}
      <Button
        variant="primary"
        size="sm"
        onClick={startBroadcast}
        disabled={pending}
      >
        <Radio className="w-3.5 h-3.5" />
        {pending ? "מתחיל..." : showInput ? "התחל שידור" : "התחל שידור חי"}
      </Button>
    </div>
  );
}
