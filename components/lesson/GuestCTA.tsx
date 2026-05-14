import Link from "next/link";
import { Sparkles, Bell, Calendar } from "lucide-react";

interface Props {
  lessonId: string;
}

/**
 * Banner ל-CTA לאורח לא מחובר. מודגש, 2-step value-prop.
 */
export function GuestCTA({ lessonId }: Props) {
  return (
    <div className="rounded-card border-2 border-primary/30 bg-gradient-to-l from-primary/5 via-white to-gold/5 p-5 shadow-soft">
      <div className="flex items-start gap-3 mb-3">
        <Sparkles className="w-6 h-6 text-gold shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="hebrew-serif text-xl font-bold text-ink mb-1">
            בנה לוח לימוד אישי
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">
            סמן שיעורים שמעניינים אותך{" "}
            <span className="text-primary font-semibold">←</span>{" "}
            קבל התראה לפני שמתחילים{" "}
            <span className="text-primary font-semibold">←</span>{" "}
            אל תפספס שיעור חי שוב.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/register?next=/lesson/${lessonId}`}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-btn bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Calendar className="w-4 h-4" />
          התחל עכשיו, חינם
        </Link>
        <Link
          href={`/login?callbackUrl=/lesson/${lessonId}`}
          className="text-sm text-ink-soft hover:text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
        >
          כבר רשום? התחבר
        </Link>
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted ms-auto">
          <Bell className="w-3 h-3" /> ללא ספאם, אפשר לבטל בכל רגע
        </span>
      </div>
    </div>
  );
}
