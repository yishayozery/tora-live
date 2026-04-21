import { BookOpen, Clock, Users, Flame } from "lucide-react";

export function LessonsCounter({
  totalLessons,
  totalHours,
  totalRabbis,
  totalViews,
}: {
  totalLessons: number;
  totalHours: number;
  totalRabbis: number;
  totalViews: number;
}) {
  const items = [
    { icon: BookOpen, label: "שיעורים עד היום", value: totalLessons, accent: "primary" },
    { icon: Clock, label: "שעות לימוד", value: totalHours, accent: "gold" },
    { icon: Users, label: "רבנים פעילים", value: totalRabbis, accent: "primary" },
    { icon: Flame, label: "צפיות כוללות", value: totalViews, accent: "danger" },
  ] as const;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 scroll-mt-16">
      {/* רקע 3: ירושלים/כותל בלילה — fixed parallax */}
      <div
        className="absolute inset-0 pointer-events-none bg-fixed bg-center bg-cover"
        aria-hidden="true"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544699030-2c1a0b54c1b9?w=1600&q=75')",
        }}
      />
      {/* Overlay כחול לקריאות */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary/95 via-primary-hover/92 to-ink/95 pointer-events-none" aria-hidden="true" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 text-white">
        <div className="relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-4 mb-3">
              <span className="w-12 h-0.5 bg-gold/60" />
              <h2 className="hebrew-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                קהילת לימוד אחת גדולה
              </h2>
              <span className="w-12 h-0.5 bg-gold/60" />
            </div>
            <p className="text-base sm:text-lg text-white/80">
              כל הנתונים מתעדכנים בזמן אמת
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
            {items.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="hebrew-serif text-3xl sm:text-4xl font-bold tabular-nums">
                  {value.toLocaleString("he-IL")}
                </div>
                <div className="text-sm text-white/70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
