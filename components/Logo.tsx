import Link from "next/link";

type Props = {
  /** "full" — אייקון + טקסט (default). "icon" — רק אייקון. */
  variant?: "full" | "icon";
  /** "lg" — בית. "md" — header. "sm" — sidebar. */
  size?: "sm" | "md" | "lg";
  /** האם הלוגו עצמו לינק לבית (default true) */
  asLink?: boolean;
  className?: string;
};

const SIZES = {
  sm: { icon: "w-7 h-7", text: "text-lg", sub: "text-[9px]", gap: "gap-2" },
  md: { icon: "w-9 h-9", text: "text-2xl", sub: "text-[11px]", gap: "gap-2.5" },
  lg: { icon: "w-14 h-14", text: "text-4xl", sub: "text-sm", gap: "gap-3" },
};

/**
 * לוגו TANA — Wordmark עברי:
 *   - "תנא" בולט ב-Frank Ruhl Libre (font-display)
 *   - מתחת: "TANA · בית מדרש חי" (טקסט קטן, latin + tagline)
 *   - אייקון מימין: מגילה + קשתות שידור + נקודת LIVE pulsing
 *
 * המשתמש בחר את "תנא" כי המושג מוכר מהתורה (תנא = חכם בית מדרש מתקופת המשנה).
 * הלוגו מבליט עברית כי קהל היעד מבין מיד את הקונספט.
 */
export function Logo({ variant = "full", size = "md", asLink = true, className = "" }: Props) {
  const s = SIZES[size];

  // ב-RTL inline-flex: הראשון ב-DOM מימין. נרצה: אייקון מימין, טקסט משמאל ← icon ראשון.
  const content = (
    <>
      <LogoIcon className={s.icon} />
      {variant === "full" && (
        <span className="leading-tight">
          <span className={`block font-display font-bold tracking-tight text-ink ${s.text}`}>
            תנא
          </span>
          {size !== "sm" && (
            <span className={`block ${s.sub} text-ink-muted tracking-wide`}>
              TANA · בית מדרש חי
            </span>
          )}
        </span>
      )}
    </>
  );

  if (!asLink) {
    return <span className={`inline-flex items-center ${s.gap} ${className}`}>{content}</span>;
  }
  return (
    <Link href="/" className={`inline-flex items-center ${s.gap} ${className}`} aria-label="תנא TANA — דף הבית">
      {content}
    </Link>
  );
}

/**
 * אייקון לוגו — SVG, גודל גמיש דרך className.
 * מגילת תורה (2 גלילים אנכיים + קלף) + נקודת LIVE pulsing למעלה.
 */
export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* רקע עגול בעדינות */}
      <rect x="2" y="6" width="44" height="36" rx="6" className="fill-primary" />

      {/* מגילת תורה — 2 גלילים אנכיים בצדדים */}
      <rect x="6" y="11" width="4" height="26" rx="2" fill="#F4E5C2" />
      <circle cx="8" cy="13" r="1.5" className="fill-gold" />
      <circle cx="8" cy="35" r="1.5" className="fill-gold" />

      <rect x="38" y="11" width="4" height="26" rx="2" fill="#F4E5C2" />
      <circle cx="40" cy="13" r="1.5" className="fill-gold" />
      <circle cx="40" cy="35" r="1.5" className="fill-gold" />

      {/* קלף הקריאה */}
      <rect x="11" y="14" width="26" height="20" rx="1" fill="#FAF6E8" />

      {/* קווי טקסט (רומזים לכתב יד תורני) */}
      <line x1="14" y1="18" x2="34" y2="18" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="22" x2="32" y2="22" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="26" x2="34" y2="26" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="30" x2="28" y2="30" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

      {/* אינדיקטור LIVE — נקודה אדומה למעלה ימין (pulsing) */}
      <circle cx="40" cy="9" r="3" className="fill-live" />
      <circle cx="40" cy="9" r="3" className="fill-live animate-ping opacity-75" />
    </svg>
  );
}
