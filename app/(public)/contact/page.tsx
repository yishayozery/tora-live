import { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "צור קשר — TORA_LIVE",
  description: "צרו קשר עם צוות TORA_LIVE — שאלות, הצעות, בעיות טכניות ובקשות שיתוף פעולה.",
};

const INFO = [
  { icon: Mail, label: "מייל", value: "info@tora-live.co.il", href: "mailto:info@tora-live.co.il" },
  { icon: Phone, label: "טלפון", value: "073-000-0000", href: "tel:0730000000" },
  { icon: MapPin, label: "כתובת", value: "ירושלים, ישראל" },
  { icon: Clock, label: "שעות מענה", value: "א׳–ה׳ 09:00–17:00" },
];

const TOPICS = [
  { value: "general", label: "שאלה כללית" },
  { value: "rabbi", label: "הצטרפות כרב / בעיה בחשבון רב" },
  { value: "technical", label: "בעיה טכנית" },
  { value: "content", label: "דיווח על תוכן לא הולם" },
  { value: "donation", label: "שאלה לגבי תרומה / קבלה" },
  { value: "partnership", label: "שיתוף פעולה / מדיה" },
];

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">צור קשר</h1>
        <p className="mt-4 text-lg text-ink-soft max-w-2xl mx-auto">
          יש שאלה, הצעה, או בעיה טכנית? נשמח לשמוע ממך. הצוות שלנו יחזור אליך בהקדם.
        </p>

        {/* Quick contact buttons — מענה מהיר */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://wa.me/972500000000?text=שלום%2C%20אני%20מעוניין%20בקשר%20עם%20TORA_LIVE"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-[#25D366] text-white font-medium hover:opacity-90 transition shadow-soft"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href="https://t.me/tora_live_official"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-[#0088cc] text-white font-medium hover:opacity-90 transition shadow-soft"
          >
            <Send className="w-4 h-4" />
            Telegram
          </a>
          <a
            href="mailto:info@tora-live.co.il"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-paper-soft border border-border text-ink-soft hover:bg-white hover:text-ink transition"
          >
            <Mail className="w-4 h-4" />
            מייל
          </a>
        </div>
        <p className="text-xs text-ink-muted mt-2">תגובה מהירה ב-WhatsApp · בדרך כלל תוך שעה בשעות פעילות</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* טופס */}
        <div className="lg:col-span-2">
          <ContactForm topics={TOPICS} />
        </div>

        {/* פרטי התקשרות */}
        <div className="space-y-4">
          <Card>
            <CardTitle>פרטי התקשרות</CardTitle>
            <div className="space-y-4 mt-4">
              {INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-ink-muted">{label}</div>
                    {href ? (
                      <a href={href} className="text-sm font-medium text-ink hover:text-primary" dir="ltr">{value}</a>
                    ) : (
                      <div className="text-sm font-medium text-ink">{value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>שאלות נפוצות</CardTitle>
            <div className="space-y-3 mt-3 text-sm">
              <Faq q="האם הצפייה בשיעורים בחינם?" a="כן. כל השיעורים והשידורים החיים פתוחים לציבור ללא הרשמה." />
              <Faq q="איך אני נרשם כרב?" a='לוחצים "הרשמת רב" בתפריט העליון. לאחר מילוי הפרטים, אדמין יאשר את החשבון.' />
              <Faq q="איך עושים תרומה?" a='בדף התרומה ניתן לתרום ולהקדיש שיעורים לזכר או לזכות יקיריכם.' />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group">
      <summary className="cursor-pointer font-medium text-ink hover:text-primary list-none flex items-start gap-2">
        <span className="text-primary mt-0.5 shrink-0">?</span>
        {q}
      </summary>
      <p className="text-ink-muted mt-1 pr-5">{a}</p>
    </details>
  );
}
