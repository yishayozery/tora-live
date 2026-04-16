import Link from "next/link";
import { BookOpen, BookMarked, Radio, Users, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-paper-warm via-paper-soft to-primary-soft/40">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-ink hover:opacity-80 transition">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="hebrew-serif text-2xl font-bold">TORA_LIVE</span>
          </Link>
          <Link href="/" className="text-sm text-ink-muted hover:text-ink transition">
            ← חזרה לדף הבית
          </Link>
        </div>
      </header>

      {/* Main — 2 columns: form + brand */}
      <main className="flex-1 grid lg:grid-cols-2 gap-0">
        {/* Left — brand side (visible on desktop) */}
        <aside className="hidden lg:flex flex-col items-center justify-center px-10 py-16 bg-gradient-to-br from-primary via-primary-hover to-primary-hover/80 text-white relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute top-1/3 left-8 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-md text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>הבית הדיגיטלי של רבני ישראל</span>
            </div>
            <h1 className="hebrew-serif text-4xl xl:text-5xl font-bold leading-tight mb-4">
              שיעורי תורה
              <br />
              <span className="text-gold">במקום אחד</span>
            </h1>
            <p className="text-white/80 text-base leading-relaxed mb-10">
              אלפי שיעורים, שידורים חיים, תפילות ואירועים — מכל הרבנים החשובים.
              הצטרף לקהילת הלומדים.
            </p>

            {/* Feature list */}
            <div className="space-y-3 text-right">
              <Feature icon={BookMarked} title="ארכיון עצום" desc="שיעורים מסווגים לפי נושא, שפה ורב" />
              <Feature icon={Radio} title="שידור חי" desc="שיעורים בזמן אמת + הקלטות שמורות" />
              <Feature icon={Users} title="קהילה" desc="שאלות בצ׳אט, פניות אישיות לרבנים" />
            </div>
          </div>
        </aside>

        {/* Right — form side */}
        <section className="flex items-center justify-center px-4 py-10 sm:py-16 lg:py-20">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-card p-3 border border-white/10">
      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-white/70">{desc}</div>
      </div>
    </div>
  );
}
