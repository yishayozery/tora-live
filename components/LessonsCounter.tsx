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
      {/* רקע 3: כחול עמוק עם כוכבים עדינים — "לוח הכבוד" */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary-hover to-ink pointer-events-none" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 15% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 70% 70%, rgba(184,134,47,0.8) 1px, transparent 1px), radial-gradient(circle at 45% 10%, white 1px, transparent 1px)",
          backgroundSize: "100px 100px, 80px 80px, 120px 120px",
        }}
      />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 text-white">
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
