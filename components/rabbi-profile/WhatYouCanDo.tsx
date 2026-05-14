import { Bell, BookmarkPlus, MessageCircle, Radio } from "lucide-react";

const ITEMS = [
  {
    Icon: Bell,
    title: "עקוב וקבל התראות",
    body: "כל שיעור חדש, חי או מוקלט — ישר למייל.",
  },
  {
    Icon: BookmarkPlus,
    title: "סמן ללוח שלך",
    body: "תזכורת לפני שיעור שמעניין אותך — כדי לא לפספס.",
  },
  {
    Icon: MessageCircle,
    title: "פנה אישית",
    body: "שאל שאלה, בקש שיעור על נושא — הרב יקרא בעצמו.",
  },
  {
    Icon: Radio,
    title: "הצטרף לשידור החי",
    body: "צפה בלייב, עקוב אחרי המקורות, שאל בזמן אמת.",
  },
];

export function WhatYouCanDo() {
  return (
    <section className="mb-10" aria-labelledby="wycd-heading">
      <h2
        id="wycd-heading"
        className="hebrew-serif text-xl sm:text-2xl font-bold text-ink mb-4"
      >
        מה אפשר כאן?
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ITEMS.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="rounded-card border border-border bg-white p-4 hover:border-primary/40 transition"
          >
            <Icon className="w-5 h-5 text-primary mb-2" aria-hidden />
            <div className="font-bold text-sm text-ink mb-1">{title}</div>
            <div className="text-xs text-ink-muted leading-relaxed">{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
