import Link from "next/link";
import {
  Sparkles,
  Zap,
  Heart,
  ScrollText,
  Calendar,
  Lock,
  Download,
  Inbox,
  Compass,
  Mic,
  KeyRound,
  Repeat,
  BookOpen,
  Tag,
  Rocket,
  MessageCircle,
  ChevronLeft,
  Palette,
} from "lucide-react";

export const revalidate = 86400;

export const metadata = {
  title: "מה חדש | TANA",
  description:
    "כל שינוי בפלטפורמת TANA — בשקיפות מלאה. עדכוני גרסאות, פיצ׳רים חדשים ושיפורים, מסודרים לפי תאריך.",
  openGraph: {
    title: "מה חדש ב-TANA",
    description:
      "כל שינוי בפלטפורמה — בשקיפות מלאה. תיעוד חי של גרסאות, פיצ׳רים ושיפורים.",
    type: "article",
  },
};

type Tone = "gold" | "primary" | "live";

type ChangeItem = {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
};

type Release = {
  version: string;
  date: string;
  title: string;
  intro?: string;
  tone: Tone;
  items: ChangeItem[];
};

const releases: Release[] = [
  {
    version: "v1.0",
    date: "מאי 2026",
    title: "גרסה יציבה ראשונה",
    intro:
      "בשלים של חודשים — דף הבית החדש, ימי עיון, לוח הקדשות חי וטונה של ייצוב מאחורי הקלעים.",
    tone: "gold",
    items: [
      { icon: Sparkles, text: "Hero חדש בדף הבית — כותרת, מצבי שידור חי/קרוב/ריק, CTA אחד בולט" },
      { icon: Heart, text: "לוח הקדשות מתגלגל — ״לרפואת״, ״לזכות״, ״לעילוי נשמת״" },
      { icon: ScrollText, text: "ימי עיון — סוג שידור ייעודי, העלאת פוסטר ותצוגה מודגשת בלוח" },
      { icon: Calendar, text: "לוח עברי בהקמת שיעור + שמירת טיוטה במעבר לשיעור קבוע" },
      { icon: Zap, text: "אופטימיזציית עומס — ISR, KV rate limit, אינדקסים, dedup צפיות" },
      { icon: Lock, text: "verify-code לפני פתיחת שידור + חלון 6 שעות לפני שיעור" },
      { icon: Download, text: "הקלטות — הודעת שגיאה ברורה אם השידור לא נשמר" },
      { icon: Inbox, text: "פניות תלמידים — מספור רץ + ניווט לדף השיעור שנוצר" },
      { icon: Compass, text: "כותרת אדמין במובייל + שם משתמש בדסקטופ" },
    ],
  },
  {
    version: "v0.9",
    date: "אפריל 2026",
    title: "שידור חי מהדפדפן ופרופיל רב מקצועי",
    intro: "השלב שבו הפלטפורמה הפכה לבית אמיתי לרבנים — שידור עצמאי, פרופיל מלא, ושיעורים קבועים.",
    tone: "primary",
    items: [
      { icon: Mic, text: "שידור חי דרך הדפדפן — WHIP / WebRTC עם Cloudflare Stream" },
      { icon: KeyRound, text: "קוד פתיחת שידור — לאפשר לעוזרים להתחיל שידור בשם הרב" },
      { icon: Repeat, text: "שיעורים קבועים — עד 6 חודשים קדימה, דילוג אוטומטי על שבת וחגים" },
      { icon: BookOpen, text: "פרופיל רב מקצועי — bio, פוסטר, מדיה (YouTube/Spotify), פניות" },
      { icon: Tag, text: "קטגוריות שיעורים — לפי נושאי תורה" },
    ],
  },
  {
    version: "v0.5",
    date: "אביב 2026",
    title: "השקה ראשונית",
    intro: "היום שבו הכל התחיל — הבית, הרבנים, השיעורים והאדמין יצאו לאוויר.",
    tone: "live",
    items: [
      { icon: Rocket, text: "השקה ראשונית: בית, רבנים, שיעורים, אדמין" },
    ],
  },
];

const toneStyles: Record<
  Tone,
  {
    card: string;
    dot: string;
    chip: string;
    chipText: string;
    accent: string;
    iconBg: string;
    iconText: string;
  }
> = {
  gold: {
    card: "bg-gold-soft/40 border-gold/30",
    dot: "bg-gold ring-gold/30",
    chip: "bg-gold-soft text-gold",
    chipText: "text-gold",
    accent: "text-gold",
    iconBg: "bg-white",
    iconText: "text-gold",
  },
  primary: {
    card: "bg-primary-soft/50 border-primary/20",
    dot: "bg-primary ring-primary/30",
    chip: "bg-primary-soft text-primary",
    chipText: "text-primary",
    accent: "text-primary",
    iconBg: "bg-white",
    iconText: "text-primary",
  },
  live: {
    card: "bg-live/10 border-live/30",
    dot: "bg-live ring-live/30",
    chip: "bg-live/15 text-emerald-700",
    chipText: "text-emerald-700",
    accent: "text-emerald-700",
    iconBg: "bg-white",
    iconText: "text-live",
  },
};

export default function ChangelogPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <header className="text-center mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold-soft px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          ב-TANA — מה חדש
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mt-4">
          כל שינוי בפלטפורמה — <span className="text-primary">בשקיפות מלאה</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
          בנינו בעצמנו, מתעדכנים בגלוי. אם תרצה לבקש פיצ׳ר — צור קשר.
        </p>
      </header>

      {/* Timeline */}
      <section aria-label="גרסאות הפלטפורמה" className="relative">
        {/* קו אנכי — מימין ב-RTL */}
        <div
          className="absolute top-2 bottom-2 right-3 sm:right-4 w-px bg-gradient-to-b from-gold/40 via-primary/30 to-live/30"
          aria-hidden="true"
        />

        <ol className="space-y-8 sm:space-y-10">
          {releases.map((r) => {
            const t = toneStyles[r.tone];
            return (
              <li key={r.version} className="relative pr-10 sm:pr-14">
                {/* נקודה צבעונית */}
                <span
                  className={`absolute top-5 right-0 sm:right-1 w-6 h-6 rounded-full ring-4 ${t.dot} flex items-center justify-center`}
                  aria-hidden="true"
                >
                  <span className="block w-2 h-2 rounded-full bg-white" />
                </span>

                <article className={`rounded-card border shadow-card p-5 sm:p-7 ${t.card}`}>
                  {/* כותרת גרסה */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${t.chip}`}
                    >
                      <Palette className="w-3 h-3" />
                      {r.version}
                    </span>
                    <span className="text-sm text-ink-muted font-medium">{r.date}</span>
                  </div>
                  <h2 className={`font-display text-2xl sm:text-3xl font-bold text-ink leading-tight`}>
                    {r.title}
                  </h2>
                  {r.intro && (
                    <p className="mt-2 text-sm sm:text-base text-ink-soft leading-relaxed">
                      {r.intro}
                    </p>
                  )}

                  {/* רשימת שינויים */}
                  <ul className="mt-5 space-y-3">
                    {r.items.map((it, idx) => {
                      const Icon = it.icon;
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <span
                            className={`shrink-0 mt-0.5 w-8 h-8 rounded-full ${t.iconBg} border border-border flex items-center justify-center`}
                            aria-hidden="true"
                          >
                            <Icon className={`w-4 h-4 ${t.iconText}`} />
                          </span>
                          <span className="text-sm sm:text-base text-ink leading-relaxed">
                            {it.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      {/* בקש פיצ'ר */}
      <section
        aria-labelledby="request-feature-title"
        className="mt-16 sm:mt-20 card p-6 sm:p-10 bg-gradient-to-b from-gold-soft/30 to-white border-gold/30 text-center"
      >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft mb-4">
          <MessageCircle className="w-6 h-6 text-gold" />
        </div>
        <h2
          id="request-feature-title"
          className="font-display text-2xl sm:text-3xl font-bold text-ink"
        >
          פיצ׳ר שחסר לך? כתוב לנו ב-WhatsApp
        </h2>
        <p className="mt-3 text-ink-soft max-w-xl mx-auto">
          אנחנו בונים את הפלטפורמה לפי המשתמשים שלה. ספר לנו מה היית רוצה לראות —
          וייתכן שהבקשה הבאה תופיע כאן.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="https://wa.me/972000000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-btn bg-live text-white font-semibold hover:opacity-90 shadow-card transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-live/30 w-full sm:w-auto"
          >
            <MessageCircle className="w-5 h-5" />
            שלח הודעה ב-WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-btn border border-border bg-white text-ink font-semibold hover:border-primary hover:text-primary transition w-full sm:w-auto"
          >
            דפדף בלוח השיעורים
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Subtle CTA */}
      <p className="mt-10 text-center text-sm text-ink-muted">
        עוקב חדש?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          הצטרף ל-TANA
        </Link>
      </p>
    </main>
  );
}
