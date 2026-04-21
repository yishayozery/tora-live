import { Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

// TODO: להחליף בציטוטים אמיתיים מתלמידים + רבנים (ברשות)
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "סוף סוף יש מקום אחד לכל השיעורים שלי. התלמידים שלי מוצאים אותי בקלות, ואני שולט על התוכן.",
    author: "הרב דוד כהן",
    role: "ראש ישיבה",
  },
  {
    quote: "אני עוקב אחרי 8 רבנים דרך האתר ומקבל התראה לכל שיעור חדש. חוסך לי שעות חיפוש ביוטיוב.",
    author: "יוסף ל.",
    role: "תלמיד, ירושלים",
  },
  {
    quote: "הפלטפורמה הראשונה שמבינה את הקהל הדתי-לאומי — בלי פרסומות, בלי הפרעות, רק תורה.",
    author: "הרב אליהו בן חיים",
    role: "רב קהילה",
  },
];

export function TestimonialsStrip() {
  return (
    <section className="relative py-12 sm:py-16 bg-white border-y border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink leading-[1.15]">
            מה אומרים עלינו
          </h2>
          <p className="text-sm text-ink-muted mt-2">רבנים ותלמידים שבחרו ב-TORA_LIVE</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="relative rounded-card border border-border bg-paper-soft p-5 hover:shadow-soft transition"
            >
              <Quote className="absolute top-3 right-3 w-6 h-6 text-gold/40 rotate-180" aria-hidden="true" />
              <blockquote className="text-sm sm:text-base text-ink leading-relaxed mb-4 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-border pt-3">
                <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center hebrew-serif font-bold text-lg shrink-0">
                  {t.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-ink text-sm truncate">{t.author}</div>
                  <div className="text-xs text-ink-muted truncate">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
