import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Radio, Users, Heart, ArrowLeft, Globe } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "TORA_LIVE — The Digital Home of Israel's Rabbis",
  description:
    "Thousands of Torah lessons, live broadcasts, and class schedules from Israel's leading rabbis — free, accessible, and open to everyone.",
  alternates: {
    canonical: "https://tora-live.co.il/en",
    languages: { "he-IL": "https://tora-live.co.il/", "en-US": "https://tora-live.co.il/en" },
  },
  openGraph: {
    title: "TORA_LIVE — The Digital Home of Israel's Rabbis",
    description: "Free Torah lessons online, from Israel's leading rabbis.",
    locale: "en_US",
    alternateLocale: ["he_IL"],
    type: "website",
  },
};

export const dynamic = "force-dynamic";

async function getStats() {
  const [totalLessons, totalRabbis, sumViews, sumDuration] = await Promise.all([
    db.lesson.count({ where: { approvalStatus: "APPROVED", isPublic: true, isSuspended: false } }),
    db.rabbi.count({ where: { status: "APPROVED", isBlocked: false } }),
    db.lesson.aggregate({ _sum: { viewCount: true }, where: { approvalStatus: "APPROVED" } }),
    db.lesson.aggregate({ _sum: { durationMin: true }, where: { approvalStatus: "APPROVED" } }),
  ]);
  return {
    totalLessons,
    totalRabbis,
    totalViews: sumViews._sum.viewCount ?? 0,
    totalHours: Math.round((sumDuration._sum.durationMin ?? 0) / 60),
  };
}

export default async function EnHomePage() {
  const stats = await getStats();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-ink py-20 sm:py-28 text-white">
        <div className="absolute -left-24 -top-24 w-96 h-96 bg-gold/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -right-32 -bottom-32 w-[32rem] h-[32rem] bg-white/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Now accessible worldwide
          </span>
          <h1 className="hebrew-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            The Digital Home of<br />Israel&apos;s Leading Rabbis
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            Thousands of Torah lessons, live broadcasts, and class schedules —
            free, accessible, and open to the entire Jewish world.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/en/about"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn bg-white text-primary font-semibold hover:bg-paper-soft transition shadow-soft"
            >
              Learn More
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <Link
              href="/en/donate"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn bg-gold text-white font-semibold hover:opacity-90 transition shadow-soft"
            >
              <Heart className="w-4 h-4" />
              Donate
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition"
            >
              <span lang="he" dir="rtl" className="hebrew-serif">לאתר העברי</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: stats.totalLessons, label: "Torah Lessons", icon: BookOpen },
              { value: stats.totalHours, label: "Hours of Learning", icon: Radio },
              { value: stats.totalRabbis, label: "Leading Rabbis", icon: Users },
              { value: stats.totalViews, label: "Views", icon: Heart },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-soft flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink tabular-nums">
                  {value.toLocaleString("en-US")}
                </div>
                <div className="text-sm text-ink-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-16 sm:py-20 bg-paper-soft">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="hebrew-serif text-3xl sm:text-5xl font-bold text-ink leading-tight mb-3">
              A single home for Torah, online
            </h2>
            <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto">
              Whether you&apos;re a student searching for a specific shiur, a rabbi looking
              to share Torah, or a donor wanting to preserve and spread Torah learning —
              TORA_LIVE was built for you.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Radio,
                title: "Live Broadcasts",
                desc: "Join live shiurim as they happen — with real-time chat, synced sources, and instant recording access.",
              },
              {
                icon: BookOpen,
                title: "Massive Archive",
                desc: "Browse thousands of lessons by rabbi, topic, series, or tractate. Every shiur is free and requires no registration to watch.",
              },
              {
                icon: Users,
                title: "Follow Your Rabbi",
                desc: "Sign up to follow your favorite rabbis, get email alerts when they go live, and build a personal learning schedule.",
              },
              {
                icon: Heart,
                title: "Dedicate a Shiur",
                desc: "Honor a loved one — in memory or in merit — by sponsoring a day of Torah learning. Tax receipts sent automatically.",
              },
              {
                icon: Globe,
                title: "Accessible Worldwide",
                desc: "Mobile-first, RTL-aware, accessibility-compliant. Works on any device, anywhere in the world.",
              },
              {
                icon: ArrowLeft,
                title: "Built for Rabbis",
                desc: "Zero-cost onboarding, a personal landing page, and full control over who sees what — rabbis keep their content, their voice, and their audience.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-card bg-white border border-border p-5 hover:shadow-soft transition">
                <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="hebrew-serif text-xl font-bold text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-paper-warm to-white border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-4">
            Help us spread Torah to the world
          </h2>
          <p className="text-ink-soft mb-8">
            TORA_LIVE is free for every learner and every rabbi. Your support keeps it that way.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/en/donate"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn bg-gold text-white font-semibold hover:opacity-90 transition shadow-soft"
            >
              <Heart className="w-4 h-4" />
              Donate Now
            </Link>
            <Link
              href="/en/about"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-btn border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition"
            >
              Read Our Story
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
