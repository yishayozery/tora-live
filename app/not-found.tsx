import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import { Search, Home, BookOpen } from "lucide-react";

export const metadata = {
  title: "הדף לא נמצא | TORA_LIVE",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper-soft flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6 opacity-50">
          <LogoIcon className="w-24 h-24" />
        </div>
        <div className="text-7xl font-bold text-primary/80 hebrew-serif">404</div>
        <h1 className="hebrew-serif text-3xl font-bold text-ink mt-4">הדף שחיפשת לא נמצא</h1>
        <p className="text-ink-soft mt-3 leading-relaxed">
          ייתכן שהקישור שגוי, או שהשיעור הוסר.
          <br />
          אבל יש עוד הרבה תוכן שמחכה לך.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition shadow-soft"
          >
            <Home className="w-4 h-4" />
            לדף הבית
          </Link>
          <Link
            href="/lessons"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-white text-ink-soft text-sm font-semibold hover:text-ink hover:border-primary transition"
          >
            <BookOpen className="w-4 h-4" />
            לקטלוג השיעורים
          </Link>
          <Link
            href="/rabbis"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-border bg-white text-ink-soft text-sm font-semibold hover:text-ink hover:border-primary transition"
          >
            <Search className="w-4 h-4" />
            רבנים
          </Link>
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          אם זה נראה כמו תקלה — <Link href="/contact" className="text-primary hover:underline">דווח לנו</Link>
        </p>
      </div>
    </div>
  );
}
