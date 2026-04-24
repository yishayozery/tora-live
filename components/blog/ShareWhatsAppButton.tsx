"use client";

import { MessageCircle } from "lucide-react";

export function ShareWhatsAppButton({ title, url }: { title: string; url: string }) {
  const text = encodeURIComponent(`${title}\n${url}`);
  const href = `https://wa.me/?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-live bg-white text-live font-semibold hover:bg-live hover:text-white transition"
      aria-label="שתף בוואטסאפ"
    >
      <MessageCircle className="w-4 h-4" />
      שתף בוואטסאפ
    </a>
  );
}
