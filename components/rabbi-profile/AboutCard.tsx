import { BookOpen } from "lucide-react";

export function AboutCard({
  bio,
  rabbiName,
  onContactAnchor,
}: {
  bio: string | null | undefined;
  rabbiName: string;
  onContactAnchor?: string;
}) {
  const text = (bio ?? "").trim();
  const isShort = text.length < 60;

  return (
    <section className="mb-8" aria-labelledby="about-heading">
      <div className="rounded-card border border-border bg-white p-5 sm:p-6">
        <h2
          id="about-heading"
          className="hebrew-serif text-xl sm:text-2xl font-bold text-ink mb-3 flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5 text-primary" />
          קצת על הרב {rabbiName}
        </h2>
        {text ? (
          <p className="text-ink-soft leading-relaxed whitespace-pre-line">
            {text}
          </p>
        ) : (
          <p className="text-ink-muted leading-relaxed">
            הרב טרם הוסיף פרטים אישיים.
          </p>
        )}
        {isShort && (
          <p className="text-sm text-ink-muted mt-3">
            רוצה לדעת עוד?{" "}
            <a
              href={onContactAnchor ?? "#hero-ctas"}
              className="text-primary hover:underline font-medium"
            >
              פנו לרב לפרטים נוספים
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
