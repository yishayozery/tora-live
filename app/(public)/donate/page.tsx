import { Heart, Sparkles, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "תרומה | TORA LIVE",
  description: "תרום שיעור תורה לעילוי נשמה, לזכות או לתמיכה כללית בפלטפורמה. קבלה מס׳ 46 נשלחת אוטומטית למייל.",
};

const AMOUNTS = [36, 52, 100, 180, 360, 540];

type HonorEntry = { type: "לזכר" | "לזכות"; honoree: string; donor: string };

const honorBoard: HonorEntry[] = [
  { type: "לזכר", honoree: "הרב שלום קורח זצ״ל", donor: "משפחת אלבז" },
  { type: "לזכות", honoree: "רפואת רחל בת מרים", donor: "אנונימי" },
  { type: "לזכר", honoree: "חנה בת יעקב ע״ה", donor: "משפחת כהן" },
  { type: "לזכות", honoree: "הצלחת הילדים בלימוד תורה", donor: "משפחת לוי" },
  { type: "לזכר", honoree: "דוד בן אברהם ע״ה", donor: "ידידי המשפחה" },
  { type: "לזכות", honoree: "זיווג הגון לדבורה בת שרה", donor: "אנונימי" },
  { type: "לזכר", honoree: "הרבנית מרים פרידמן ע״ה", donor: "תלמידי הרב" },
  { type: "לזכות", honoree: "הצלחת עם ישראל", donor: "משפחת מזרחי" },
];

export default function DonatePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <header className="text-center mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold-soft px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          תרומה לזיכוי הרבים
        </span>
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mt-4">
          תרום שיעור — <span className="text-primary">לזכר, לזכות או לתמיכה</span>
        </h1>
        <p className="mt-5 text-lg text-ink-soft max-w-2xl mx-auto">
          בעזרתך אלפי יהודים נחשפים לשיעורי תורה חינם. כל תרומה מזכה אותך ואת יקיריך בלימוד תורה אמיתי.
        </p>
      </header>

      {/* Two tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* Dedication form */}
        <section className="lg:col-span-2 card p-6 sm:p-8" aria-labelledby="dedicate-title">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-soft">
              <Heart className="w-5 h-5 text-gold" />
            </div>
            <h2 id="dedicate-title" className="hebrew-serif text-2xl font-bold text-ink">
              הקדש שיעור
            </h2>
          </div>

          <form className="space-y-5" action="#" method="POST">
            {/* dedication type */}
            <fieldset>
              <legend className="block text-sm font-semibold text-ink mb-2">סוג הקדשה</legend>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer transition">
                  <input type="radio" name="dedicationType" value="lezecher" defaultChecked className="sr-only" />
                  לעילוי נשמה
                </label>
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer transition">
                  <input type="radio" name="dedicationType" value="lezechut" className="sr-only" />
                  לזכות
                </label>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="honoree" className="block text-sm font-semibold text-ink mb-1.5">
                  שם המוקדש
                </label>
                <input
                  id="honoree"
                  name="honoree"
                  type="text"
                  required
                  placeholder="לדוגמה: יצחק בן אברהם"
                  className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label htmlFor="dedicateDate" className="block text-sm font-semibold text-ink mb-1.5">
                  תאריך
                </label>
                <input
                  id="dedicateDate"
                  name="dedicateDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label htmlFor="donorName" className="block text-sm font-semibold text-ink mb-1.5">
                  שם התורם
                </label>
                <input
                  id="donorName"
                  name="donorName"
                  type="text"
                  required
                  className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label htmlFor="donorEmail" className="block text-sm font-semibold text-ink mb-1.5">
                  דוא״ל לקבלה
                </label>
                <input
                  id="donorEmail"
                  name="donorEmail"
                  type="email"
                  required
                  className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-ink mb-2">סכום התרומה (₪)</legend>
              <div className="flex flex-wrap gap-2">
                {AMOUNTS.map((a, i) => (
                  <label
                    key={a}
                    className="inline-flex items-center justify-center h-10 min-w-[72px] px-3 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer text-sm font-semibold transition"
                  >
                    <input
                      type="radio"
                      name="amount"
                      value={a}
                      defaultChecked={i === 2}
                      className="sr-only"
                    />
                    ₪{a}
                  </label>
                ))}
                <div className="flex items-center gap-2">
                  <label htmlFor="customAmount" className="sr-only">סכום אחר</label>
                  <input
                    id="customAmount"
                    name="customAmount"
                    type="number"
                    min={10}
                    placeholder="סכום אחר"
                    className="w-32 h-10 px-3 rounded-btn border border-border bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="showOnHonorBoard"
                defaultChecked
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              הצג את ההקדשה בלוח הכבוד
            </label>

            <button
              type="submit"
              className="w-full h-12 rounded-btn bg-primary text-white text-base font-semibold hover:bg-primary-hover shadow-soft transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              המשך לתשלום מאובטח
            </button>

            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-live" />
              קבלה מס׳ 46 תישלח אוטומטית למייל לאחר התשלום.
            </p>
          </form>
        </section>

        {/* General donation */}
        <aside className="card p-6 sm:p-8 bg-gold-soft/30 border-gold/30" aria-labelledby="general-title">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <Heart className="w-5 h-5 text-danger" />
            </div>
            <h2 id="general-title" className="hebrew-serif text-xl font-bold text-ink">
              תרומה כללית
            </h2>
          </div>
          <p className="text-sm text-ink-soft mb-5">
            תמוך בפלטפורמה כדי לשמור על שיעורי התורה חינמיים לכולם.
          </p>

          <form className="space-y-4" action="#" method="POST">
            <div>
              <label htmlFor="gAmount" className="block text-sm font-semibold text-ink mb-1.5">
                סכום (₪)
              </label>
              <input
                id="gAmount"
                name="amount"
                type="number"
                min={10}
                defaultValue={100}
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="gName" className="block text-sm font-semibold text-ink mb-1.5">
                שם
              </label>
              <input
                id="gName"
                name="name"
                type="text"
                required
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="gEmail" className="block text-sm font-semibold text-ink mb-1.5">
                דוא״ל
              </label>
              <input
                id="gEmail"
                name="email"
                type="email"
                required
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-btn bg-gold text-white font-semibold hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
            >
              תרום
            </button>
          </form>
        </aside>
      </div>

      {/* Honor board */}
      <section aria-labelledby="honor-title" className="mt-4">
        <div className="text-center mb-8">
          <h2 id="honor-title" className="hebrew-serif text-3xl font-bold text-gold">
            לוח הכבוד
          </h2>
          <p className="mt-2 text-sm text-ink-soft">תודה לתורמים שהקדישו שיעור לזיכוי הרבים</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {honorBoard.map((h, i) => (
            <div
              key={i}
              className="card p-5 text-center border-gold/30 bg-gradient-to-b from-gold-soft/40 to-white"
            >
              <div className="text-xs font-semibold text-gold uppercase tracking-wider">{h.type}</div>
              <div className="mt-2 hebrew-serif text-lg font-bold text-ink">{h.honoree}</div>
              <div className="mt-2 text-xs text-ink-muted">הוקדש ע״י {h.donor}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
