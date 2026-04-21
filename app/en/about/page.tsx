import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen, Radio, Users, Heart, Target, Compass, Shield, Sparkles,
  CheckCircle2, Globe, Quote, Mail
} from "lucide-react";

export const metadata: Metadata = {
  title: "About TORA_LIVE — Our Mission",
  description:
    "TORA_LIVE is the digital home of Israel's leading rabbis — a free, accessible platform that brings Torah lessons, live broadcasts, and learning schedules to the entire Jewish world.",
  alternates: {
    canonical: "https://tora-live.co.il/en/about",
    languages: { "he-IL": "https://tora-live.co.il/about", "en-US": "https://tora-live.co.il/en/about" },
  },
  openGraph: {
    title: "About TORA_LIVE",
    description: "The digital home of Israel's leading rabbis.",
    locale: "en_US",
    type: "article",
  },
};

export default function EnAboutPage() {
  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-ink py-20 sm:py-24 text-white">
        <div className="absolute -left-24 -top-24 w-96 h-96 bg-gold/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Our Mission
          </span>
          <h1 className="hebrew-serif text-4xl sm:text-6xl font-bold leading-[1.1] mb-6">
            Bringing Torah<br />to Every Home
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto">
            TORA_LIVE is more than a platform. It&apos;s a commitment to
            the idea that Torah learning should be accessible,
            organized, and free — for every Jew, everywhere.
          </p>
        </div>
      </header>

      {/* The problem */}
      <section className="py-16 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-6">
            The problem we&apos;re solving
          </h2>
          <div className="space-y-4 text-ink-soft leading-relaxed text-base sm:text-lg">
            <p>
              Every day, hundreds of Torah lessons are taught across Israel —
              in yeshivot, communities, and private living rooms. Each one is
              a gift to the Jewish world.
            </p>
            <p>
              But most of them never reach beyond the room they&apos;re taught in.
              Students who missed a class can&apos;t easily find the recording.
              Those abroad who want to learn from their favorite rabbi have
              to search through dozens of disconnected YouTube channels,
              Facebook pages, and WhatsApp groups.
            </p>
            <p className="text-ink font-medium">
              Rabbis don&apos;t have a digital home. And learners don&apos;t have a trusted,
              central place to find them.
            </p>
            <p>
              TORA_LIVE was built to change that.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 bg-paper-soft border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-10 text-center">
            Our founding principles
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Heart,
                title: "Torah first",
                desc: "Every design decision asks one question: will this help more Jews learn more Torah? No ads. No data sold. No distractions.",
              },
              {
                icon: Shield,
                title: "The rabbi owns the content",
                desc: "Every rabbi has full control. They decide what's public, private, or on-demand. They keep their audience. They can leave anytime and take their content with them.",
              },
              {
                icon: Globe,
                title: "Free forever",
                desc: "Torah has been free for 3,300 years. It will stay free here. No paywalls. No subscriptions. Donor-supported, mission-first.",
              },
              {
                icon: Compass,
                title: "Built for the religious-Zionist world",
                desc: "Deep respect for the Dati-Leumi and Chardal communities. Carefully built around the Hebrew calendar, Shabbat, and festivals. No broadcasting on holy days.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-card bg-white border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="hebrew-serif text-xl font-bold text-ink">{title}</h3>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-16 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-8 text-center">
            What TORA_LIVE provides
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Radio, title: "Live Broadcasts", desc: "Hundreds of weekly live shiurim with real-time chat, synced source sheets, and immediate recording." },
              { icon: BookOpen, title: "Complete Archive", desc: "Every shiur — searchable by rabbi, topic, tractate, or parasha. Free to watch without registering." },
              { icon: Users, title: "Community Tools", desc: "Follow your favorite rabbis, get notifications, save bookmarks, build a personal learning schedule." },
              { icon: Heart, title: "Dedication System", desc: "Dedicate a shiur in memory or in merit of loved ones. Receipt sent automatically, displayed on the Honor Board." },
              { icon: Target, title: "Rabbi Dashboard", desc: "Rabbis get a professional landing page, scheduling tools, analytics, and full moderation over student questions." },
              { icon: Globe, title: "Accessible Everywhere", desc: "Full WCAG 2.1 AA compliance. Mobile-first. RTL and LTR. Works on any device, worldwide." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5">
                <Icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="hebrew-serif text-lg font-bold text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="py-16 bg-paper-soft border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-8 text-center">
            Who we serve
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Rabbis & Teachers",
                desc: "From rashei yeshiva to community rabbis — a digital home with zero onboarding cost.",
                points: ["Personal landing page", "Live streaming tools", "Student management", "Full content ownership"],
              },
              {
                title: "Students & Learners",
                desc: "From Yeshiva University to the smallest moshav — find your rabbi, follow the daf, join a live shiur.",
                points: ["Free, no registration to watch", "Personal learning schedule", "Email alerts", "Cross-platform access"],
              },
              {
                title: "Donors & Supporters",
                desc: "Those who want to preserve and spread Torah for the next generation.",
                points: ["Dedicate specific shiurim", "Transparent impact reporting", "Tax-deductible (Amutah 580 pending)", "Legacy giving options"],
              },
            ].map((s) => (
              <div key={s.title} className="rounded-card bg-white border border-border p-6">
                <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-soft mb-4 leading-relaxed">{s.desc}</p>
                <ul className="space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                      <CheckCircle2 className="w-4 h-4 text-live shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision quote */}
      <section className="py-16 bg-gradient-to-br from-gold-soft via-paper-warm to-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Quote className="w-10 h-10 text-gold mx-auto mb-4 rotate-180" aria-hidden="true" />
          <blockquote className="hebrew-serif text-2xl sm:text-3xl font-bold text-ink leading-[1.4] mb-6">
            &ldquo;The voice of Torah should reach every corner of the
            Jewish world — and it should sound like the rabbi who taught
            it, not like an algorithm.&rdquo;
          </blockquote>
          <p className="text-sm text-ink-muted">— Our founding vision</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-4">
            Join us
          </h2>
          <p className="text-ink-soft mb-8 max-w-xl mx-auto">
            Whether you want to donate, partner with us, or bring a rabbi
            onto the platform — we&apos;d love to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/en/donate"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn bg-gold text-white font-semibold hover:opacity-90 transition shadow-soft"
            >
              <Heart className="w-4 h-4" />
              Donate
            </Link>
            <a
              href="mailto:info@tora-live.co.il"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
