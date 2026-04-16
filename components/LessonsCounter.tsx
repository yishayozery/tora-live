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
    <section className="max-w-6xl mx-auto px-4 mt-14 mb-20">
      <div className="rounded-card bg-gradient-to-l from-primary to-primary-hover p-8 sm:p-10 text-white shadow-soft overflow-hidden relative">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-gold/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="text-center mb-8">
            <h2 className="hebrew-serif text-3xl sm:text-4xl font-bold">
              קהילת לימוד אחת גדולה
            </h2>
            <p className="text-white/80 mt-2">
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
