import Link from "next/link";
import { Radio, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";

/**
 * באנר מתמשך — מוצג רק לרב שיש לו שיעור עם isLive=true כרגע.
 * נותן דרך מהירה לחזור לאולפן השידור גם אחרי שנע לדפים אחרים במובייל.
 */
export async function ActiveBroadcastBanner({ rabbiId }: { rabbiId: string }) {
  const liveLesson = await db.lesson.findFirst({
    where: { rabbiId, isLive: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });

  if (!liveLesson) return null;

  return (
    <Link
      href={`/lesson/${liveLesson.id}`}
      className="block bg-gradient-to-l from-danger to-danger/80 text-white px-4 py-2.5 hover:from-danger/90 hover:to-danger/70 transition print:hidden"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <Radio className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm truncate">
            אתה משדר עכשיו: <span className="opacity-90">{liveLesson.title}</span>
          </span>
        </div>
        <span className="text-sm font-medium inline-flex items-center gap-1 shrink-0">
          חזור לאולפן <ArrowLeft className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
