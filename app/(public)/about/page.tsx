import { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  Sparkles,
  Feather,
  BookOpenCheck,
  DoorOpen,
  ChevronLeft,
  Mic,
  Mail,
  UserRound,
} from "lucide-react";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "הסיפור שלנו | TORA_LIVE",
  description:
    "מי בנה את TORA_LIVE — ולמה. אתר אחד שמכבד את התורה ואת הזמן של תלמידיה. פלטפורמה חינמית, נטולת פרסומות, שנבנית עם הרבנים והתלמידים הראשונים.",
  openGraph: {
    title: "הסיפור שלנו | TORA_LIVE",
    description:
      "אתר אחד שמכבד את התורה ואת הזמן של תלמידיה. כך נולדה TORA_LIVE.",
    type: "article",
    locale: "he_IL",
  },
  twitter: {
    card: "summary_large_image",
    title: "הסיפור שלנו | TORA_LIVE",
    description: "אתר אחד שמכבד את התורה ואת הזמן של תלמידיה.",
  },
};

const values = [
  {
    icon: Feather,
    title: "פרטיות תחילה",
    desc: "מייל וטלפון של רבנים לעולם לא חשופים לציבור. כל פנייה עוברת דרך הפלטפורמה, בכבוד וברצינות.",
    ring: "from-primary/10 to-primary/0",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    icon: BookOpenCheck,
    title: "כבוד התורה",
    desc: "הפלטפורמה נטולת פרסומות. אין באנרים, אין מודעות בין שיעור לשיעור — השיעורים במרכז, נקודה.",
    ring: "from-gold/15 to-gold/0",
    iconBg: "bg-gold-soft",
    iconColor: "text-gold",
  },
  {
    icon: DoorOpen,
    title: "דלת פתוחה",
    desc: "לא נועלים אותך. תוכל לעזוב מתי שתרצה, ולקחת איתך את התוכן שלך — בלי תנאים ובלי שאלות.",
    ring: "from-live/15 to-live/0",
    iconBg: "bg-emerald-50",
    iconColor: "text-live",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      {/* === Hero === */}
      <header className="text-center mb-14 sm:mb-20">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold-soft px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          הסיפור שלנו
        </span>
        <h1 className="font-display font-bold text-ink leading-[1.1] tracking-tight text-4xl sm:text-5xl lg:text-6xl mt-5">
          מי בנה את <span className="text-primary">TORA_LIVE</span> — ולמה
        </h1>
        <p className="hebrew-serif mt-5 text-lg sm:text-xl text-ink-soft max-w-2xl mx-auto leading-relaxed">
          אתר אחד שמכבד את התורה ואת הזמן של תלמידיה.
        </p>
      </header>

      {/* === הסיפור === */}
      <section
        aria-labelledby="story-title"
        className="mb-16 sm:mb-20"
      >
        <h2 id="story-title" className="sr-only">
          הסיפור שלנו
        </h2>

        <div className="hebrew-serif text-lg sm:text-xl text-ink leading-[1.9] space-y-6 max-w-2xl mx-auto">
          <p>
            <span className="block font-bold text-primary text-base sm:text-lg tracking-wide uppercase mb-2 hebrew-serif">
              הצורך
            </span>
            רבנים מעבירים שיעורים מדהימים — ולא מגיעים לאף אחד. תלמידים מחפשים
            שיעור מסוים, עוברים בין קבוצות וואטסאפ, פותחים עשרים לשוניות,
            ובסוף מוותרים. וואטסאפ נשבר תחת עומס הלינקים. תוכן יקר ערך הולך
            לאיבוד בתוך שטף ההודעות, ואנשים שמחפשים תורה — נשארים בלי תורה.
          </p>

          <p>
            <span className="block font-bold text-primary text-base sm:text-lg tracking-wide uppercase mb-2 hebrew-serif">
              הרעיון
            </span>
            רצינו פלטפורמה אחת. לא YouTube גנרי שמערבב שיעור בגמרא עם פרסומת
            למוצרי ניקיון. לא אתר אישי יקר שכל רב צריך לתחזק לבד. מקום אחד,
            פשוט, מכובד — שמבין שהוא משרת רבנים ותלמידים, לא משווקים. בית
            דיגיטלי לתורה.
          </p>

          <p>
            <span className="block font-bold text-primary text-base sm:text-lg tracking-wide uppercase mb-2 hebrew-serif">
              העקרונות
            </span>
            חינם. תמיד. בלי כוכביות ובלי "פרימיום". פרטיות תחילה — מייל וטלפון
            של רבנים נשמרים אצלנו ולא נחשפים לציבור. כבוד התורה והמלמדים בכל
            פרט בעיצוב. ופשטות שמכבדת את הזמן של כולם — נכנסים, לומדים,
            יוצאים. בלי משוכות, בלי הרשמה לצפייה, בלי טפסים מיותרים.
          </p>

          <p>
            <span className="block font-bold text-primary text-base sm:text-lg tracking-wide uppercase mb-2 hebrew-serif">
              המסע
            </span>
            אנחנו בשלב מוקדם, ולא מתביישים בזה. בונים את האתר יחד עם הרבנים
            והתלמידים הראשונים שלנו. כל פידבק, כל תלונה, כל הצעה — מעצבים את
            הצעד הבא. אם משהו לא עובד טוב, נשמח לשמוע. אם משהו עובד — נשמח
            לדעת שגם זה. זאת בנייה משותפת, לאט ובכוונה.
          </p>
        </div>
      </section>

      {/* === מה אנחנו מבטיחים === */}
      <section aria-labelledby="promises-title" className="mb-16 sm:mb-20">
        <div className="text-center mb-10">
          <h2
            id="promises-title"
            className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink"
          >
            מה אנחנו מבטיחים
          </h2>
          <p className="mt-3 text-ink-soft text-sm sm:text-base">
            שלושה עקרונות שלא מתפשרים עליהם — לא היום, ולא בעתיד.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, desc, ring, iconBg, iconColor }) => (
            <Card
              key={title}
              className={`relative overflow-hidden bg-gradient-to-b ${ring} hover:shadow-soft transition`}
            >
              <div
                className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mb-4`}
              >
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">
                {title}
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* === מי עומד מאחורי האתר === */}
      <section
        aria-labelledby="team-title"
        className="mb-16 sm:mb-20"
      >
        <Card className="bg-gradient-to-br from-paper-soft to-white border-gold/20 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-right">
            <div className="shrink-0" aria-hidden="true">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gold-soft border-2 border-gold/30 flex items-center justify-center overflow-hidden">
                <UserRound className="w-12 h-12 sm:w-14 sm:h-14 text-gold/70" />
              </div>
            </div>

            <div className="flex-1">
              <h2
                id="team-title"
                className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink"
              >
                מי עומד מאחורי האתר
              </h2>
              <p className="text-sm text-ink-muted mt-1">הצוות של TORA_LIVE</p>
              <blockquote className="hebrew-serif text-lg sm:text-xl text-ink leading-relaxed mt-4 border-r-4 border-gold/50 pr-4">
                &ldquo;פיתחנו את האתר מתוך אהבת תורה ורצון להנגיש אותה. אנחנו
                לא חברה — אנחנו תלמידים שבנו לעצמם את המקום שתמיד חיפשנו.&rdquo;
              </blockquote>
            </div>
          </div>
        </Card>
      </section>

      {/* === CTA דו-צדדי === */}
      <section aria-labelledby="cta-title" className="mb-16 sm:mb-20">
        <h2 id="cta-title" className="sr-only">
          איך להמשיך מכאן
        </h2>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          <Link
            href="/rabbis"
            className="group block rounded-card border border-border bg-white p-6 sm:p-8 shadow-card hover:border-primary hover:shadow-soft transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
                <BookOpenCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                אתה תלמיד?
              </span>
            </div>
            <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">
              ראה את הרבנים
            </h3>
            <p className="text-sm text-ink-soft mb-4">
              גלה רבני קהילות, עקוב אחרי השיעורים, ובנה לעצמך לוח לימוד אישי.
            </p>
            <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
              לכל הרבנים
              <ChevronLeft className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/rabbis/join"
            className="group block rounded-card border border-gold/30 bg-gradient-to-br from-gold-soft/40 to-white p-6 sm:p-8 shadow-card hover:border-gold hover:shadow-soft transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <Mic className="w-5 h-5 text-gold" />
              </div>
              <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                אתה רב?
              </span>
            </div>
            <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">
              הצטרף אלינו
            </h3>
            <p className="text-sm text-ink-soft mb-4">
              פתח לך בית דיגיטלי בחינם, חבר את ערוץ השידור שלך, ותן לתלמידים
              למצוא אותך בקלות.
            </p>
            <span className="inline-flex items-center gap-1 text-gold font-semibold text-sm group-hover:gap-2 transition-all">
              להצטרפות רב
              <ChevronLeft className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* === Footer micro-section === */}
      <section
        aria-label="קישורים נוספים"
        className="border-t border-border pt-8 text-center"
      >
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
          <li>
            <a
              href="mailto:hello@tora-live.co.il"
              className="inline-flex items-center gap-1.5 hover:text-primary transition"
            >
              <Mail className="w-4 h-4" />
              צור קשר
            </a>
          </li>
          <li>
            <Link href="/privacy" className="hover:text-primary transition">
              מדיניות פרטיות
            </Link>
          </li>
          <li>
            <Link href="/terms" className="hover:text-primary transition">
              תנאי שימוש
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
