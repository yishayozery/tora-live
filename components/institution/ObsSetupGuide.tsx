"use client";

// מדריך התקנת OBS / Raspberry Pi לחדר חדש.
// מציג שלבים ברורים עם כפתורי העתקה ל-RTMP URL ו-Stream Key.

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  BookOpen,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

type Props = {
  rtmpUrl: string;
  streamKey: string;
  roomName: string;
};

export function ObsSetupGuide({ rtmpUrl, streamKey, roomName }: Props) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
          <BookOpen className="w-5 h-5" />
        </span>
        <div>
          <CardTitle className="mb-0">מדריך התקנה — {roomName}</CardTitle>
          <p className="text-sm text-ink-muted">איך מחברים את החדר ל-TANA</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <details open className="group rounded-card border border-border bg-paper-soft/40">
          <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none select-none">
            <span className="font-display text-lg font-bold text-ink">
              OBS Studio (מומלץ)
            </span>
            <ChevronDown className="w-5 h-5 text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-5 pt-1">
            <ol className="space-y-4">
              <Step number={1}>
                הורד את OBS Studio (חינם, ל-Windows / Mac / Linux):{" "}
                <a
                  href="https://obsproject.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  dir="ltr"
                >
                  obsproject.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Step>
              <Step number={2}>
                פתח את OBS Studio ולחץ על <Kbd>Settings</Kbd> →{" "}
                <Kbd>Stream</Kbd>.
              </Step>
              <Step number={3}>
                בשדה <Kbd>Service</Kbd> בחר <Kbd>Custom...</Kbd>.
              </Step>
              <Step number={4}>
                העתק את ה-RTMP URL והדבק בשדה <Kbd>Server</Kbd>:
                <CopyField label="RTMP URL" value={rtmpUrl} />
              </Step>
              <Step number={5}>
                העתק את ה-Stream Key והדבק בשדה <Kbd>Stream Key</Kbd>:
                <CopyField label="Stream Key" value={streamKey} secret />
              </Step>
              <Step number={6}>
                לחץ <Kbd>OK</Kbd> ולאחר מכן <Kbd>Start Streaming</Kbd> כדי להתחיל בשידור.
              </Step>
              <Step number={7}>
                הזרם יופיע בדף השיעור ב-TANA תוך 10-30 שניות.
              </Step>
            </ol>
          </div>
        </details>

        <details className="group rounded-card border border-border bg-paper-soft/40">
          <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none select-none">
            <span className="font-display text-lg font-bold text-ink">
              Raspberry Pi (מתקדם)
            </span>
            <ChevronDown className="w-5 h-5 text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-5 pt-1">
            <p className="text-sm text-ink-soft leading-relaxed">
              מוכן להתקין Raspberry Pi קבוע בחדר? צור קשר עם הצוות לקבלת ה-script של
              ה-daemon. בקרוב: התקנה אוטומטית עם הזנת deviceToken בלבד.
            </p>
            <a
              href="mailto:support@tora-live.co.il?subject=Raspberry Pi setup"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
            >
              צור קשר עם הצוות
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </details>
      </div>
    </Card>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold tabular-nums">
        {number}
      </span>
      <div className="flex-1 min-w-0 text-sm text-ink leading-relaxed pt-0.5">
        {children}
      </div>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block px-1.5 py-0.5 rounded border border-border bg-white text-xs font-mono text-ink">
      {children}
    </code>
  );
}

function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const display = revealed ? value : "•".repeat(Math.min(value.length, 32));

  return (
    <div className="mt-2">
      <span className="sr-only">{label}</span>
      <div className="flex items-stretch gap-2">
        <code
          dir="ltr"
          className="flex-1 min-w-0 h-10 px-3 inline-flex items-center rounded-btn border border-border bg-white text-ink text-xs font-mono truncate"
        >
          {display}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="w-10 shrink-0 inline-flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft text-ink"
            aria-label={revealed ? "הסתר" : "הצג"}
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="w-10 shrink-0 inline-flex items-center justify-center rounded-btn border border-border bg-white hover:bg-paper-soft text-ink"
          aria-label={`העתק ${label}`}
        >
          {copied ? <Check className="w-4 h-4 text-live" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
