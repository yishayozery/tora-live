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
  sm: { icon: "w-6 h-6", text: "text-base", gap: "gap-1.5" },
  md: { icon: "w-8 h-8", text: "text-2xl", gap: "gap-2" },
  lg: { icon: "w-12 h-12", text: "text-4xl", gap: "gap-3" },
};

/**
 * לוגו TORA_LIVE — מעצב ייחודי שמשלב:
 * - מגילת תורה פתוחה (2 גלילים אנכיים)
 * - גלי שידור (3 קשתות) שיוצאים מהמרכז → רומז ל-"חי"
 * - נקודה אדומה קטנה למעלה כסימן LIVE
 */
export function Logo({ variant = "full", size = "md", asLink = true, className = "" }: Props) {
  const s = SIZES[size];

  const content = (
    <>
      <LogoIcon className={s.icon} />
      {variant === "full" && (
        <span className={`hebrew-serif font-bold tracking-tight text-ink ${s.text}`}>
          TORA<span className="text-primary">_</span>LIVE
        </span>
      )}
    </>
  );

  if (!asLink) {
    return <span className={`inline-flex items-center ${s.gap} ${className}`}>{content}</span>;
  }
  return (
    <Link href="/" className={`inline-flex items-center ${s.gap} ${className}`} aria-label="TORA_LIVE — דף הבית">
      {content}
    </Link>
  );
}

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
      {/* גליל ימין */}
      <rect x="6" y="11" width="4" height="26" rx="2" fill="#F4E5C2" />
      <circle cx="8" cy="13" r="1.5" className="fill-gold" />
      <circle cx="8" cy="35" r="1.5" className="fill-gold" />

      {/* גליל שמאל */}
      <rect x="38" y="11" width="4" height="26" rx="2" fill="#F4E5C2" />
      <circle cx="40" cy="13" r="1.5" className="fill-gold" />
      <circle cx="40" cy="35" r="1.5" className="fill-gold" />

      {/* קלף הקריאה */}
      <rect x="11" y="14" width="26" height="20" rx="1" fill="#FAF6E8" />

      {/* קווי טקסט */}
      <line x1="14" y1="18" x2="34" y2="18" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="22" x2="32" y2="22" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="26" x2="34" y2="26" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="30" x2="28" y2="30" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

      {/* אינדיקטור LIVE — נקודה אדומה למעלה ימין */}
      <circle cx="40" cy="9" r="3" className="fill-live" />
      <circle cx="40" cy="9" r="3" className="fill-live animate-ping opacity-75" />
    </svg>
  );
}
