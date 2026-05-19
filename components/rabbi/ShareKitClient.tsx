"use client";

import { useState } from "react";
import { Copy, Check, MessageSquare, Mail, Link2, QrCode, Download } from "lucide-react";

type Props = {
  url: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
  tagline: string;
};

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };
  return { copiedKey, copy };
}

function CopyButton({
  text,
  k,
  copiedKey,
  copy,
  label = "העתק",
}: {
  text: string;
  k: string;
  copiedKey: string | null;
  copy: (t: string, k: string) => void;
  label?: string;
}) {
  const isCopied = copiedKey === k;
  return (
    <button
      type="button"
      onClick={() => copy(text, k)}
      className={
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-btn text-sm font-medium transition border " +
        (isCopied
          ? "bg-live/10 text-live border-live/30"
          : "bg-white text-ink border-border hover:border-primary hover:text-primary")
      }
      aria-live="polite"
    >
      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {isCopied ? "הועתק!" : label}
    </button>
  );
}

export function ShareKitCopyBlocks({
  whatsappText,
  emailSubject,
  emailBody,
  tagline,
}: Omit<Props, "url">) {
  const { copiedKey, copy } = useCopy();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-card border border-border bg-white shadow-card p-5 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="hebrew-serif text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-live" />
            הודעה ל-WhatsApp
          </h3>
          <CopyButton text={whatsappText} k="wa" copiedKey={copiedKey} copy={copy} />
        </div>
        <pre className="flex-1 whitespace-pre-wrap font-sans text-sm text-ink-soft bg-paper-soft rounded-btn p-3 leading-relaxed">
          {whatsappText}
        </pre>
      </div>

      <div className="rounded-card border border-border bg-white shadow-card p-5 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="hebrew-serif text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            הודעת מייל
          </h3>
          <CopyButton text={`${emailSubject}\n\n${emailBody}`} k="mail" copiedKey={copiedKey} copy={copy} />
        </div>
        <div className="text-xs text-ink-muted mb-1">נושא:</div>
        <div className="text-sm text-ink mb-3 font-medium">{emailSubject}</div>
        <pre className="flex-1 whitespace-pre-wrap font-sans text-sm text-ink-soft bg-paper-soft rounded-btn p-3 leading-relaxed">
          {emailBody}
        </pre>
      </div>

      <div className="rounded-card border border-border bg-white shadow-card p-5 md:col-span-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="hebrew-serif text-lg font-bold">משפט קצר לחתימה / ביו</h3>
          <CopyButton text={tagline} k="tag" copiedKey={copiedKey} copy={copy} />
        </div>
        <div className="text-sm text-ink-soft bg-paper-soft rounded-btn p-3 break-all">
          {tagline}
        </div>
      </div>
    </div>
  );
}

export function ShareKitActions({ url, whatsappText, emailSubject, emailBody }: Props) {
  const { copiedKey, copy } = useCopy();

  const waHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
    emailBody
  )}`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="h-12 rounded-btn bg-live text-white hover:opacity-90 inline-flex items-center justify-center gap-2 font-medium shadow-soft"
      >
        <MessageSquare className="w-5 h-5" />
        שתף ב-WhatsApp
      </a>
      <a
        href={mailHref}
        className="h-12 rounded-btn bg-primary text-white hover:bg-primary-hover inline-flex items-center justify-center gap-2 font-medium shadow-soft"
      >
        <Mail className="w-5 h-5" />
        שלח במייל
      </a>
      <button
        type="button"
        onClick={() => copy(url, "url")}
        className={
          "h-12 rounded-btn inline-flex items-center justify-center gap-2 font-medium border transition " +
          (copiedKey === "url"
            ? "bg-live/10 text-live border-live/30"
            : "bg-white text-ink border-border hover:border-primary hover:text-primary")
        }
      >
        {copiedKey === "url" ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
        {copiedKey === "url" ? "הקישור הועתק!" : "העתק קישור"}
      </button>
      <a
        href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
          url
        )}&color=1E40AF&bgcolor=ffffff&download=1`}
        target="_blank"
        rel="noreferrer"
        className="h-12 rounded-btn bg-gold text-white hover:opacity-90 inline-flex items-center justify-center gap-2 font-medium shadow-soft"
      >
        <QrCode className="w-5 h-5" />
        הורד QR
      </a>
    </div>
  );
}

export function DownloadImageButton({ src, filename }: { src: string; filename: string }) {
  return (
    <a
      href={src}
      download={filename}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn border border-border bg-white text-ink-soft hover:border-primary hover:text-primary text-sm"
    >
      <Download className="w-4 h-4" />
      הורד תמונה
    </a>
  );
}
