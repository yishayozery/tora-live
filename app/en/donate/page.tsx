import Link from "next/link";
import type { Metadata } from "next";
import {
  Heart, Sparkles, ShieldCheck, BookOpen, Users, Clock, Globe,
  CheckCircle2, Mail, Award, HandHeart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Donate — TORA_LIVE",
  description:
    "Support free Torah learning for the entire Jewish world. Dedicate a shiur in memory or in merit of a loved one. Tax receipts sent automatically.",
  alternates: {
    canonical: "https://tora-live.co.il/en/donate",
    languages: { "he-IL": "https://tora-live.co.il/donate", "en-US": "https://tora-live.co.il/en/donate" },
  },
  openGraph: {
    title: "Donate — TORA_LIVE",
    description: "Help bring Torah to every home.",
    locale: "en_US",
    type: "website",
  },
};

const IMPACT = [
  { amount: 36, usd: 10, icon: Clock, label: "One hour of learning", desc: "reaches 15 students" },
  { amount: 100, usd: 27, icon: BookOpen, label: "One complete shiur", desc: "published on the platform" },
  { amount: 180, usd: 49, icon: Users, label: "100 students", desc: "receive the shiur + reminders" },
  { amount: 540, usd: 147, icon: Globe, label: "One full day", desc: "of live broadcasts worldwide" },
];

const AMOUNTS = [54, 100, 180, 360, 540, 1000];

type HonorEntry = { type: "In memory of" | "In merit of"; honoree: string; donor: string };
const honorBoard: HonorEntry[] = [
  { type: "In memory of", honoree: "Rabbi Shalom Koracha, zt\"l", donor: "The Elbaz Family" },
  { type: "In merit of", honoree: "Rachel bat Miriam — refuah shelemah", donor: "Anonymous" },
  { type: "In memory of", honoree: "Chana bat Yaakov, a\"h", donor: "The Cohen Family" },
  { type: "In merit of", honoree: "Success of our children in Torah learning", donor: "The Levy Family" },
  { type: "In memory of", honoree: "David ben Avraham, a\"h", donor: "Friends of the Family" },
  { type: "In merit of", honoree: "A proper shidduch for Devorah bat Sarah", donor: "Anonymous" },
  { type: "In memory of", honoree: "Rebbetzin Miriam Friedman, a\"h", donor: "Rabbi's Students" },
  { type: "In merit of", honoree: "Success of Am Yisrael", donor: "The Mizrachi Family" },
];

export default function EnDonatePage() {
  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-gold via-gold-soft to-paper-warm py-16 sm:py-20 border-b border-gold/30">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-gold/30 rounded-full px-4 py-1.5 text-sm font-semibold text-gold mb-5">
            <Sparkles className="w-4 h-4" />
            Support Torah learning for everyone
          </span>
          <h1 className="hebrew-serif text-4xl sm:text-6xl font-bold leading-[1.1] text-ink mb-5">
            Dedicate a Shiur —<br />
            <span className="text-gold">in memory, in merit, or in support</span>
          </h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto">
            Every donation brings Torah to thousands of learners — free of charge,
            with no ads, and no hidden costs. Your gift plants a seed that keeps
            growing, every single day.
          </p>
        </div>
      </header>

      {/* Impact */}
      <section className="py-12 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink text-center mb-8">
            Your donation makes a real impact
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {IMPACT.map((it) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.amount}
                  className="rounded-card border border-border bg-paper-soft p-5 text-center hover:border-gold/50 hover:shadow-soft transition"
                >
                  <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-gold-soft flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="hebrew-serif text-2xl font-bold text-gold">
                    ${it.usd}
                  </div>
                  <div className="text-xs text-ink-muted">
                    (₪{it.amount})
                  </div>
                  <div className="text-sm font-semibold text-ink mt-2">{it.label}</div>
                  <div className="text-xs text-ink-muted mt-1">{it.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two tracks — Dedication + General */}
      <section className="py-16 bg-paper-soft">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Dedication form */}
            <div className="lg:col-span-2 rounded-card bg-white border border-border p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-gold-soft flex items-center justify-center">
                  <Heart className="w-5 h-5 text-gold" />
                </div>
                <h2 className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink">
                  Dedicate a Shiur
                </h2>
              </div>
              <p className="text-sm text-ink-soft mb-6">
                Honor a loved one by dedicating a day of Torah learning to their memory
                or merit. The dedication appears on the site homepage and on every shiur
                taught that day, and a tax receipt is emailed to you automatically.
              </p>

              <form className="space-y-5" action="#" method="POST">
                {/* Dedication type */}
                <fieldset>
                  <legend className="block text-sm font-semibold text-ink mb-2">Dedication type</legend>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer transition">
                      <input type="radio" name="dedicationType" value="memory" defaultChecked className="sr-only" />
                      In memory of
                    </label>
                    <label className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer transition">
                      <input type="radio" name="dedicationType" value="merit" className="sr-only" />
                      In merit of
                    </label>
                    <label className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer transition">
                      <input type="radio" name="dedicationType" value="general" className="sr-only" />
                      General support
                    </label>
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="honoree" className="block text-sm font-semibold text-ink mb-1.5">
                      Name of honoree
                    </label>
                    <input
                      id="honoree"
                      name="honoree"
                      type="text"
                      required
                      placeholder="e.g. Yitzhak ben Avraham"
                      className="w-full h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                    <p className="text-xs text-ink-muted mt-1">Hebrew name preferred, but English is fine too.</p>
                  </div>
                  <div>
                    <label htmlFor="dedicateDate" className="block text-sm font-semibold text-ink mb-1.5">
                      Date
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
                      Your name
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
                      Email for receipt
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
                  <legend className="block text-sm font-semibold text-ink mb-2">Amount (USD)</legend>
                  <div className="flex flex-wrap gap-2">
                    {AMOUNTS.map((a, i) => (
                      <label
                        key={a}
                        className="inline-flex items-center justify-center h-11 min-w-[80px] px-4 rounded-btn border border-border bg-paper-soft has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer text-sm font-semibold transition"
                      >
                        <input
                          type="radio"
                          name="amount"
                          value={a}
                          defaultChecked={i === 2}
                          className="sr-only"
                        />
                        ${a}
                      </label>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        name="customAmount"
                        type="number"
                        min={10}
                        placeholder="Other"
                        className="w-32 h-11 px-3 rounded-btn border border-border bg-white text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  Display my dedication on the Honor Board
                </label>

                <button
                  type="submit"
                  className="w-full h-12 rounded-btn bg-primary text-white text-base font-semibold hover:bg-primary-hover shadow-soft transition"
                >
                  Continue to secure payment
                </button>

                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <ShieldCheck className="w-4 h-4 text-live" />
                  Tax receipt (46A) emailed automatically after payment.
                </div>
              </form>
            </div>

            {/* Sidebar: General + Tax info */}
            <aside className="space-y-6">
              <div className="rounded-card bg-gold-soft/50 border border-gold/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-5 h-5 text-gold" />
                  <h3 className="hebrew-serif text-xl font-bold text-ink">Legacy Giving</h3>
                </div>
                <p className="text-sm text-ink-soft mb-4">
                  Plant Torah for generations. Reserve an entire shiur series, a rabbi&apos;s
                  annual program, or a permanent dedication on the Honor Board.
                </p>
                <a
                  href="mailto:info@tora-live.co.il?subject=Legacy%20Giving%20Inquiry"
                  className="inline-flex items-center gap-1.5 text-gold font-semibold hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  Contact us to discuss
                </a>
              </div>

              <div className="rounded-card bg-white border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <HandHeart className="w-5 h-5 text-danger" />
                  <h3 className="hebrew-serif text-xl font-bold text-ink">Why donate?</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-ink-soft">
                  {[
                    "100% of donations go to platform operations and rabbi support",
                    "No ads, no data selling — ever",
                    "Your impact is transparent — see exactly what your gift funded",
                    "Tax-deductible in Israel (46A) — US/Canadian options coming soon",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-live shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-card bg-primary-soft border border-primary/20 p-6">
                <h3 className="hebrew-serif text-lg font-bold text-ink mb-2">Other ways to give</h3>
                <ul className="text-sm text-ink-soft space-y-2">
                  <li>
                    <strong>Bank transfer:</strong> Email us for details
                  </li>
                  <li>
                    <strong>Check by mail:</strong> Available on request
                  </li>
                  <li>
                    <strong>Donor-advised fund:</strong> We accept DAF grants
                  </li>
                </ul>
                <a
                  href="mailto:info@tora-live.co.il?subject=Alternative%20donation%20method"
                  className="mt-3 inline-flex items-center gap-1.5 text-primary font-semibold hover:underline text-sm"
                >
                  <Mail className="w-4 h-4" />
                  info@tora-live.co.il
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Honor board */}
      <section className="py-14 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-gold mb-2">
              Honor Board
            </h2>
            <p className="text-sm text-ink-soft">
              With gratitude to the donors who&apos;ve dedicated Torah learning to their loved ones
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {honorBoard.map((h, i) => (
              <div
                key={i}
                className="rounded-card border border-gold/30 bg-gradient-to-b from-gold-soft/40 to-white p-5 text-center"
              >
                <div className="text-xs font-semibold text-gold uppercase tracking-wider">{h.type}</div>
                <div className="mt-2 hebrew-serif text-base font-bold text-ink leading-tight">{h.honoree}</div>
                <div className="mt-2 text-xs text-ink-muted">Dedicated by {h.donor}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tax info footer */}
      <section className="py-12 bg-paper-soft border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-ink-soft">
          <p className="mb-2">
            <strong>TORA_LIVE</strong> is operated as a not-for-profit initiative.
            Israeli donations are tax-deductible under Section 46A (pending Amutah approval).
          </p>
          <p>
            For US and Canadian tax-deductible options, please{" "}
            <a href="mailto:info@tora-live.co.il" className="text-primary hover:underline font-medium">
              contact us
            </a>.
          </p>
          <div className="mt-6">
            <Link
              href="/en/about"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-border bg-white hover:border-primary hover:text-primary transition text-sm font-medium"
            >
              Learn more about our mission
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
