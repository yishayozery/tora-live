"use client";

import { useState } from "react";
import { MessageCircle, Send, Link as LinkIcon, Check, Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
  rabbiName?: string;
};

export function ShareButtons({ url, title, rabbiName }: Props) {
  const [copied, setCopied] = useState(false);
  const fullText = rabbiName ? `${title} — ${rabbiName} ב-TORA_LIVE` : title;
  const encoded = encodeURIComponent(`${fullText}\n${url}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title, text: fullText, url }); } catch {}
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-ink-muted ml-1">שתף:</span>
      <a
        href={`https://wa.me/?text=${encoded}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition active:scale-95"
        aria-label="שתף ב-WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(fullText)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-[#0088cc] text-white text-sm font-medium hover:opacity-90 transition active:scale-95"
        aria-label="שתף ב-Telegram"
      >
        <Send className="w-4 h-4" />
        Telegram
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border bg-white text-ink-soft text-sm font-medium hover:text-ink hover:bg-paper-soft transition active:scale-95"
        aria-label="העתק קישור"
      >
        {copied ? <Check className="w-4 h-4 text-live" /> : <LinkIcon className="w-4 h-4" />}
        {copied ? "הועתק" : "העתק"}
      </button>
      <button
        type="button"
        onClick={nativeShare}
        className="sm:hidden inline-flex items-center gap-1.5 h-9 w-9 rounded-btn border border-border bg-white text-ink-soft hover:bg-paper-soft transition active:scale-95"
        aria-label="שתף"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}
