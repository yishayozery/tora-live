// /rabbis/why — מכתב אישי לרב.
// מיועד לשיתוף ב-WhatsApp/מייל לרבנים ספציפיים בפנייה ראשונית.
// בניגוד ל-/rabbis/join (feature list), כאן הטון נרטיבי, סינסרי, וקצר.

import Link from "next/link";
import {
  Heart,
  Lock,
  Gift,
  ArrowLeftRight,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { formatHebrewDateLetters } from "@/lib/utils";

export const metadata = {
  title: "מכתב לרב — למה להצטרף ל-TORA_LIVE",
  description:
    "מכתב פתוח לרבני ישראל: למה בנינו את TORA_LIVE, מה אנחנו מציעים, ומה אנחנו מבטיחים. כל ההסבר במכתב אחד.",
  openGraph: {
    title: "מכתב לרב — למה להצטרף ל-TORA_LIVE",
    description:
      "מכתב פתוח לרבני ישראל: מה הצורך, מה אנחנו מציעים, ומה אנחנו מבטיחים.",
    type: "article",
    locale: "he_IL",
  },
};

// ISR — תוכן יציב, לא צריך רענון תכוף.
export const revalidate = 86400;

export default function LetterToRabbiPage() {
  // formatHebrewDateLetters משתמש בלוגיקה ידנית (לא Intl) — תקין על Vercel Node.
  const today = formatHebrewDateLetters(new Date(), true);

  return (
    <main className="bg-paper-warm min-h-screen py-8 sm:py-14 print:bg-white print:py-0">
      {/* === מכתב — נראה כמו דף נייר === */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-border rounded-card shadow-soft p-6 sm:p-10 lg:p-14 print:shadow-none print:border-0">
          {/* === ראש המכתב === */}
          <header className="mb-8 sm:mb-10 text-center">
            <div className="text-xs sm:text-sm text-ink-muted hebrew-serif mb-1">בס&quot;ד</div>
            <div className="text-xs sm:text-sm text-ink-muted">{today}</div>
          </header>

          {/* === פתיחה === */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight mb-2">
            לכבוד הרב היקר,
          </h1>
          <p className="hebrew-serif text-base sm:text-lg text-ink-soft mb-8 leading-relaxed">
            שלום וברכה.
          </p>

          {/* === גוף המכתב — נרטיב hebrew-serif === */}
          <section className="hebrew-serif text-base sm:text-lg text-ink leading-loose space-y-5">
            <p>
              אנחנו פונים אליך כי ידוע לנו ששיעוריך מגיעים לקהל מסוים — אך
              הרבה יותר אנשים היו שמחים להאזין, אם רק היו יודעים מתי, איפה, ואיך.
            </p>
            <p>
              <strong className="font-bold">TORA_LIVE</strong> נבנתה מתוך הצורך הזה.
              אתר אחד שמרכז את לוח השיעורים שלך, את השידור החי, ואת הארכיון —
              במקום אחד נקי, מקצועי, חינמי. תלמידיך לא יצטרכו עוד לחפש לינקים
              ב-WhatsApp או לעקוב אחרי 4 פלטפורמות שונות.
            </p>
            <p>
              לא ניסינו להמציא רעיון חדש. ראינו שרבני קהילות, ראשי ישיבות,
              ומגידי שיעורים — כולם נתקלים באותה בעיה: <em>עבודה גדולה של הוראת תורה,
              ולצידה התנהלות דיגיטלית מפוזרת ומתישה.</em> רצינו לבנות תשתית
              שתעלים את הצד השני ותשאיר רק את הלימוד.
            </p>
            <p>
              מה שאנחנו מציעים, בפשטות:
            </p>
          </section>

          {/* === 4 הבטחות עיקריות — לא feature list === */}
          <ul className="mt-6 space-y-3 hebrew-serif text-base sm:text-lg text-ink leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-soft text-primary text-sm font-bold mt-0.5">1</span>
              <span>
                <strong className="font-bold">דף משלך</strong> בכתובת <code className="font-mono text-sm bg-paper-soft px-1.5 py-0.5 rounded">tora-live.co.il/rabbi/שמך</code> — עם תמונה, ביוגרפיה, וכל השיעורים שלך.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-soft text-primary text-sm font-bold mt-0.5">2</span>
              <span>
                <strong className="font-bold">לוח שיעורים חי</strong> — תלמידים יודעים בדיוק מתי השיעור הבא, ומקבלים תזכורות אוטומטיות.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-soft text-primary text-sm font-bold mt-0.5">3</span>
              <span>
                <strong className="font-bold">שידור חי + הקלטה אוטומטית</strong> — שדר ישירות מהדפדפן או מ-YouTube, ההקלטה נשמרת בארכיון 30 יום.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-soft text-primary text-sm font-bold mt-0.5">4</span>
              <span>
                <strong className="font-bold">ריכוז פניות מתלמידים</strong> — סוף לשאלות שמתפזרות ב-WhatsApp. הכל במקום אחד, ממוין.
              </span>
            </li>
          </ul>

          {/* === מה אנחנו מבטיחים === */}
          <section className="hebrew-serif text-base sm:text-lg text-ink leading-loose space-y-5 mt-10">
            <p>ומה שחשוב לא פחות — מה <em>לא</em> נעשה:</p>
          </section>

          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            <Promise icon={Gift} title="חינם">
              לא ניקח ממך שקל. לעולם.
            </Promise>
            <Promise icon={Lock} title="פרטיות">
              המייל והטלפון שלך לעולם לא חשופים לציבור.
            </Promise>
            <Promise icon={ArrowLeftRight} title="דלת פתוחה">
              תוכל לעזוב מתי שתרצה, ולקחת את התוכן איתך.
            </Promise>
          </div>

          {/* === הזמנה === */}
          <section className="hebrew-serif text-base sm:text-lg text-ink leading-loose space-y-5 mt-10">
            <p>
              אנחנו מזמינים את הרב להצטרף. ההרשמה לוקחת שלוש דקות. אחרי שתאשר —
              נדאג להעלות את הדף הראשון שלך תוך 24 שעות, יחד איתך,
              עם תמיכה אישית בכל שאלה.
            </p>
            <p>
              אם הרב מעדיף לחשוב, או לראות איך נראה דף של רב שכבר הצטרף —
              נשמח לשלוח לינק לדוגמה. אם יש שאלות, אפשר לכתוב לנו ישירות
              ב-WhatsApp או במייל.
            </p>
            <p className="text-ink-muted text-base">
              בברכה,<br />
              <span className="hebrew-serif text-lg sm:text-xl font-bold text-ink mt-2 block">צוות TORA_LIVE</span>
            </p>
          </section>

          {/* === CTA === */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-3 sm:justify-between print:hidden">
            <Link
              href="/register?role=rabbi"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-btn bg-amber-500 hover:bg-amber-400 text-slate-900 text-base font-bold shadow-card transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 w-full sm:w-auto"
            >
              <Heart className="w-4 h-4" />
              הצטרפו עכשיו — 3 דקות
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex gap-2 text-sm text-ink-muted">
              <Link
                href="/rabbis/join"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                ראה את כל היכולות
              </Link>
              <span className="text-ink-muted">·</span>
              <PrintButton />
            </div>
          </div>
        </div>

        {/* === הערה דיסקרטית — נראה רק על האקרן, לא בהדפסה === */}
        <p className="text-center text-xs text-ink-muted mt-6 print:hidden">
          מכתב זה ניתן לשיתוף בחופשיות. לכל שאלה — אנחנו כאן.
        </p>
      </article>

      {/* CSS Print — הופך את הדף למסמך A4 נקי בלחיצת הדפסה */}
      <style>{`
        @media print {
          @page { margin: 18mm; }
          body { background: white !important; }
        }
      `}</style>
    </main>
  );
}

function Promise({ icon: Icon, title, children }: { icon: typeof Heart; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-gold/30 bg-gradient-to-b from-gold-soft/40 to-white p-4 text-center">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold/15 mb-2">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="font-display font-bold text-ink mb-1">{title}</div>
      <div className="hebrew-serif text-sm text-ink-soft leading-snug">{children}</div>
    </div>
  );
}

