"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Radio,
  Square,
  Send,
  CheckCircle2,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
} from "lucide-react";

type ChatMsg = {
  id: string;
  studentName: string;
  content: string;
  isAnswered: boolean;
  createdAt: string;
};

type Props = {
  lessonId: string;
  lessonTitle: string;
  stream: MediaStream;
  startedAt: Date;
  onEnded: () => void;
};

/**
 * אולפן שידור — מוצג אחרי שהרב לחץ "התחל שידור בפועל".
 * שומר על ה-stream של המצלמה, מציג מונה, מוני צופים, וצ'אט חי.
 */
export function RabbiBroadcastStudio({
  lessonId,
  lessonTitle,
  stream,
  startedAt,
  onEnded,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [elapsed, setElapsed] = useState("00:00:00");
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [pending, startTransition] = useTransition();
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // חבר את המצלמה לוידאו
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  // מונה זמן
  useEffect(() => {
    function tick() {
      const diff = Date.now() - startedAt.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  // Polling: chat + viewer count כל 3 שניות
  useEffect(() => {
    let aborted = false;

    async function pull() {
      try {
        const [chatRes, statsRes] = await Promise.all([
          fetch(`/api/lessons/${lessonId}/chat`),
          fetch(`/api/lessons/${lessonId}/live-stats`),
        ]);
        if (aborted) return;
        if (chatRes.ok) {
          const data: ChatMsg[] = await chatRes.json();
          setMessages(data);
        }
        if (statsRes.ok) {
          const s = await statsRes.json();
          setViewerCount(s.viewerCount ?? 0);
        }
      } catch {}
    }
    pull();
    const id = window.setInterval(pull, 3000);
    return () => { aborted = true; window.clearInterval(id); };
  }, [lessonId]);

  // Auto-scroll צ'אט
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function toggleAudio() {
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setAudioEnabled((v) => !v);
  }
  function toggleVideo() {
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setVideoEnabled((v) => !v);
  }

  async function markAnswered(msgId: string) {
    await fetch(`/api/lessons/${lessonId}/chat/${msgId}/answer`, { method: "POST" });
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isAnswered: true } : m)));
  }

  async function sendReply(msgId: string) {
    const text = (replyMap[msgId] || "").trim();
    if (!text) return;
    // תשובה מוצגת כהודעה מהרב עצמו — כרגע אין "רב ב-chat". נעבור לסימן "נענה" וחוץ מזה לשלוח הודעה כתלמיד לא אפשרי. במקום זה: סימון כנענה.
    await markAnswered(msgId);
    setReplyingId(null);
    setReplyMap((m) => ({ ...m, [msgId]: "" }));
  }

  function endBroadcast() {
    startTransition(async () => {
      await fetch(`/api/lessons/${lessonId}/live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false }),
      });
      // כיבוי המצלמה
      stream.getTracks().forEach((t) => {
        try { t.stop(); } catch {}
      });
      onEnded();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="אולפן שידור חי">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 bg-gradient-to-r from-danger to-danger/80 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="font-bold text-sm">משדר עכשיו</span>
          </div>
          <span className="text-xs opacity-80 hidden sm:inline">·</span>
          <span className="text-xs font-mono tabular-nums">{elapsed}</span>
          <span className="text-xs opacity-80 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-sm truncate max-w-[200px]">{lessonTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2 py-1 rounded-full">
            <Users className="w-3.5 h-3.5" />
            <span className="tabular-nums">{viewerCount}</span>
            <span className="hidden sm:inline">צופים</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={endBroadcast}
            disabled={pending}
            className="bg-white text-danger hover:bg-white/90 border-0"
          >
            <Square className="w-3.5 h-3.5" />
            {pending ? "מסיים..." : "סיים שידור"}
          </Button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Video */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-[240px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
              <div className="text-center">
                <VideoOff className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <div className="text-sm">המצלמה כבויה</div>
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2">
            <button
              onClick={toggleAudio}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                audioEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-danger text-white"
              }`}
              aria-label={audioEnabled ? "השתק" : "בטל השתקה"}
              title={audioEnabled ? "השתק מיקרופון" : "הפעל מיקרופון"}
            >
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                videoEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-danger text-white"
              }`}
              aria-label={videoEnabled ? "כבה מצלמה" : "הדלק מצלמה"}
              title={videoEnabled ? "כבה מצלמה" : "הדלק מצלמה"}
            >
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Info overlay */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-btn px-3 py-1.5 text-white text-xs flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-live" />
            <span>אתה משדר</span>
          </div>
        </div>

        {/* Chat + viewers panel */}
        <aside className="lg:w-96 flex flex-col bg-white border-t lg:border-t-0 lg:border-r border-border min-h-[300px] lg:min-h-0">
          <div className="px-4 h-11 flex items-center gap-2 border-b border-border shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-ink text-sm">שאלות מהצופים</span>
            <span className="text-xs text-ink-muted mr-auto">({messages.length})</span>
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-ink-muted py-10">
                עדיין אין שאלות.
                <br />
                הצופים יכולים לשלוח שאלות מדף השיעור.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-card p-3 text-sm transition ${
                    m.isAnswered
                      ? "bg-paper-soft/70 border border-border"
                      : "bg-gold-soft/40 border border-gold/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-ink text-xs">{m.studentName}</span>
                    {m.isAnswered ? (
                      <span className="inline-flex items-center gap-1 text-live text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> נענה
                      </span>
                    ) : null}
                  </div>
                  <p className="text-ink whitespace-pre-line break-words">{m.content}</p>
                  {!m.isAnswered && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => markAnswered(m.id)}
                        className="text-xs text-live hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> סמן כנענה
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
