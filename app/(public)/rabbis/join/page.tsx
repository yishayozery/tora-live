// /rabbis/join — דף נחיתה להמרת רבנים חדשים לפלטפורמה.
// Server component: שולף ספירת רבנים פעילים מה-DB ל-stat chip.
// מבנה: Hero → "מה תקבל" → "איך זה עובד" → FAQ → CTA סוגר.

import Link from "next/link";
import {
  Mic,
  Calendar,
  Radio,
  MessageSquare,
  Bell,
  Search,
  ChevronLeft,
  UserPlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";

export const metadata = {
  title: "הצטרפות רבנים | TORA_LIVE",
  description:
    "TORA_LIVE היא הבית הדיגיטלי של רבני ישראל. דף משלך, לוח שיעורים, שידור חי, ופניות מסודרות מתלמידים — בחינם. הצטרף בכמה דקות.",
  openGraph: {
    title: "הצטרפות רבנים | TORA_LIVE",
    description:
      "דף רב משלך, לוח שיעורים, שידור חי, פניות מסודרות מתלמידים — בחינם. הצטרף לקהילת הרבנים של TORA_LIVE.",
    type: "website",
    locale: "he_IL",
  },
};

// ISR — מתרענן כל 5 דקות (ספירת רבנים אינה משתנה לעיתים תכופות)
export const revalidate = 300;

const BENEFITS = [
  {
    icon: Mic,
    title: "דף רב מקצועי",
    desc: "כתובת אישית בצורת tora-live.co.il/rabbi/שמך, עם תמונה, ביוגרפיה וכל השיעורים שלך במקום אחד.",
  },
  {
    icon: Calendar,
    title: "לוח שיעורים אוטומטי",
    desc: "התלמידים יודעים בדיוק מתי ואיפה. תזמן פעם אחת — המערכת מסנכרנת ושולחת תזכורות.",
  },
  {
    icon: Radio,
    title: "שידור חי + הקלטה",
    desc: "שדר חי ישירות מהאתר. ההקלטה נשמרת אוטומטית בארכיון שלך ל-30 יום.",
  },
  {
    icon: MessageSquare,
    title: "פניות מתלמידים — מסודר",
    desc: "סוף לשאלות שמתפזרות ב-WhatsApp. כל הפניות מרוכזות במקום אחד, ממוינות לפי נושא.",
  },
  {
    icon: Bell,
    title: "התראות לעוקבים",
    desc: "מייל ו-WhatsApp נשלחים אוטומטית לתלמידים שלך כשיש שיעור חדש או שידור חי.",
  },
  {
    icon: Search,
    title: "SEO עברי חזק",
    desc: "התוכן שלך מאונדקס בגוגל בעברית. תלמידים חדשים מוצאים אותך גם בלי שיתופים.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "הרשמה תוך 3 דקות",
    desc: "טופס קצר: שם, תחום הוראה, פרטי קשר. בלי ניירת ובלי טפסים מסובכים.",
  },
  {
    n: "2",
    title: "אישור מהאדמין",
    desc: "אנחנו בודקים את הפרטים ומאשרים — לרוב באותו יום. אתה מקבל מייל כשהכל מוכן.",
  },
  {
    n: "3",
    title: "מתחילים לשדר",
    desc: "מעלה שיעורים, פותח שידור חי, ומגיע לקהל. הכל מהדשבורד הפרטי שלך.",
  },
];

const FAQ = [
  {
    q: "האם זה באמת חינם?",
    a: "כן, לחלוטין. אין דמי הרשמה, אין דמי שימוש חודשיים, ואין עמלות על שיעורים. אנחנו ממומנים מתרומות של אוהבי תורה.",
  },
  {
    q: "מה התלמידים שלי יראו?",
    a: "דף נחיתה מסודר שלך, לוח שיעורים שבועי, ארכיון של כל ההקלטות, וכפתור 'צפה בשידור חי' כשאתה משדר. הכל מעוצב מקצועית — בלי שאתה צריך לגעת בעיצוב.",
  },
  {
    q: "האם אני יכול לעצור או לעזוב מתי שאני רוצה?",
    a: "כן, ללא תנאים וללא קנסות. אפשר להשהות פעילות באמצעות הדשבורד, או למחוק את החשבון לחלוטין בקליק אחד.",
  },
  {
    q: "יש לי כבר ערוץ YouTube — איך זה משתלב?",
    a: "אנחנו מסנכרנים אוטומטית את הסרטונים האחרונים שלך מהערוץ. אתה ממשיך להעלות ליוטיוב כרגיל — והם מופיעים גם בדף שלך כאן.",
  },
];

// בחר רב לדוגמה לקישור הסיור — מעדיף את אליעזר מלמד אם קיים, אחרת הראשון
async function pickExampleRabbiSlug(): Promise<string | null> {
  try {
    const featured = await db.rabbi.findFirst({
      where: { status: "APPROVED", isBlocked: false, slug: "eliezer-melamed" },
      select: { slug: true },
    });
    if (featured) return featured.slug;
    const fallback = await db.rabbi.findFirst({
      where: { status: "APPROVED", isBlocked: false },
      orderBy: { createdAt: "asc" },
      select: { slug: true },
    });
    return fallback?.slug ?? null;
  } catch {
    return null;
  }
}

async function countActiveRabbis(): Promise<number> {
  try {
    return await db.rabbi.count({
      where: { status: "APPROVED", isBlocked: false },
    });
  } catch {
    return 0;
  }
}

export default async function RabbisJoinPage() {
  const [activeCount, exampleSlug] = await Promise.all([
    countActiveRabbis(),
    pickExampleRabbiSlug(),
  ]);

  const exampleHref = exampleSlug ? `/rabbi/${exampleSlug}` : "/rabbis";

  return (
    <main className="bg-paper">
      {/* === Hero === */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="הצטרפות רבנים — פתיחה"
      >
        {/* רקעים דקורטיביים */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800"
          aria-hidden="true"
        />
        <div
          className="absolute -top-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-amber-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32 text-center">
          {/* Stat chip — כמה רבנים כבר משדרים */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-live/15 border border-live/40 text-emerald-300 backdrop-blur-sm text-sm font-semibold mb-6">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span>
              {activeCount > 0
                ? `${activeCount.toLocaleString("he-IL")} רבנים כבר משדרים`
                : "מצטרפים ראשונים — כעת"}
            </span>
          </div>

          <h1 className="font-display font-bold text-white leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            הצטרף —{" "}
            <span className="text-amber-300">והתורה שלך תגיע לאלפים</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            TORA_LIVE היא הבית הדיגיטלי של רבני ישראל. דף משלך, לוח שיעורים,
            שידור חי, פניות מסודרות מתלמידים — בחינם.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/register?role=rabbi"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-btn bg-amber-500 hover:bg-amber-400 text-slate-900 text-base sm:text-lg font-bold shadow-card transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 w-full sm:w-auto"
            >
              <UserPlus className="w-5 h-5" />
              <span>צור חשבון רב</span>
            </Link>
            <Link
              href={exampleHref}
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-btn bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white text-base sm:text-lg font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 w-full sm:w-auto"
            >
              <span>ראה רב לדוגמה</span>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ללא עלות. ללא התחייבות. אפשר לעזוב בקליק.
          </p>
        </div>
      </section>

      {/* === מה תקבל === */}
      <section
        className="max-w-6xl mx-auto px-4 py-16 sm:py-20"
        aria-labelledby="benefits-title"
      >
        <header className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold-soft px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            מה תקבל
          </span>
          <h2
            id="benefits-title"
            className="font-display text-3xl sm:text-4xl font-bold text-ink mt-4"
          >
            כל הכלים — <span className="text-primary">במקום אחד</span>
          </h2>
          <p className="mt-3 text-base text-ink-soft max-w-2xl mx-auto">
            אנחנו דואגים לטכנולוגיה. אתה מתרכז בלימוד וההוראה.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <article
                key={b.title}
                className="rounded-card border border-border bg-white shadow-card p-6 transition hover:border-primary/40 hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">
                  {b.title}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {b.desc}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* === איך זה עובד === */}
      <section
        className="bg-paper-soft border-y border-border"
        aria-labelledby="steps-title"
      >
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <header className="text-center mb-12">
            <h2
              id="steps-title"
              className="font-display text-3xl sm:text-4xl font-bold text-ink"
            >
              איך זה <span className="text-primary">עובד</span>
            </h2>
            <p className="mt-3 text-base text-ink-soft">
              שלושה שלבים — ואתה משדר.
            </p>
          </header>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="relative rounded-card border border-border bg-white p-6 shadow-card"
              >
                <div className="absolute -top-4 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-white font-bold shadow-card">
                  {s.n}
                </div>
                <h3 className="hebrew-serif text-xl font-bold text-ink mt-2 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* === FAQ === */}
      <section
        className="max-w-3xl mx-auto px-4 py-16 sm:py-20"
        aria-labelledby="faq-title"
      >
        <header className="text-center mb-10">
          <h2
            id="faq-title"
            className="font-display text-3xl sm:text-4xl font-bold text-ink"
          >
            שאלות <span className="text-primary">נפוצות</span>
          </h2>
        </header>

        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-card border border-border bg-white shadow-soft overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-5 hover:bg-paper-soft transition">
                <h3 className="hebrew-serif text-base sm:text-lg font-bold text-ink">
                  {item.q}
                </h3>
                <ChevronLeft
                  className="w-5 h-5 text-ink-muted shrink-0 transition group-open:-rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 -mt-1 text-sm sm:text-base text-ink-soft leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* === CTA סוגר === */}
      <section
        className="relative isolate overflow-hidden border-t border-gold/30"
        aria-labelledby="final-cta-title"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-gold-soft via-amber-100 to-gold-soft"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h2
            id="final-cta-title"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight"
          >
            מוכן להצטרף?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-soft max-w-xl mx-auto">
            קליק אחד מפריד אותך מקהל של אלפים.
          </p>
          <div className="mt-8">
            <Link
              href="/register?role=rabbi"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-8 sm:px-10 rounded-btn bg-gold text-white text-base sm:text-lg font-bold shadow-card hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
            >
              <UserPlus className="w-5 h-5" />
              <span>צור חשבון רב</span>
            </Link>
          </div>
          <p className="mt-5 text-xs text-ink-muted">
            הרשמה חינם · אישור באותו יום · בלי התחייבות
          </p>
        </div>
      </section>
    </main>
  );
}
