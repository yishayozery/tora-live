import { requireSession } from "@/lib/session";
import { ProposeEventForm } from "@/components/ProposeEventForm";

export const metadata = {
  title: "הציעי יום עיון | TORA LIVE",
  description: "הצע יום עיון חדש — כל משתמש רשום יכול להציע אירוע תורני לאישור האדמין.",
};

export default async function ProposeEventPage() {
  await requireSession();
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <header className="text-center mb-8">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">
          הצעת <span className="text-primary">יום עיון</span>
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          כל משתמש רשום יכול להציע יום עיון או אירוע תורני. ההצעה תועבר לאישור אדמין ותפורסם לציבור.
        </p>
      </header>
      <ProposeEventForm />
    </div>
  );
}
