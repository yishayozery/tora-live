import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { LogoIcon } from "@/components/Logo";
import { BookmarkButton } from "@/components/BookmarkButton";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { Bookmark, Calendar, Clock, Bell, BookmarkX } from "lucide-react";

export const metadata = { title: "השיעורים שסימנתי | TORA_LIVE" };

export default async function MyBookmarksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?from=/my/bookmarks");

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card><CardDescription>סימוניות זמינות רק למשתמשי תלמיד.</CardDescription></Card>
      </div>
    );
  }

  const bookmarks = await db.bookmark.findMany({
    where: { studentId: student.id },
    include: {
      lesson: {
        include: { rabbi: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Split: upcoming + past
  const now = new Date();
  const upcoming = bookmarks.filter((b) => b.lesson.scheduledAt >= now);
  const past = bookmarks.filter((b) => b.lesson.scheduledAt < now);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8 flex items-center gap-3">
        <Bookmark className="w-8 h-8 text-primary" />
        <div>
          <h1 className="hebrew-serif text-3xl font-bold text-ink">השיעורים שסימנתי</h1>
          <p className="text-sm text-ink-muted">{bookmarks.length} שיעורים בלוח האישי שלך</p>
        </div>
      </header>

      {bookmarks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookmarkX className="w-12 h-12 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-soft mb-2">עוד אין לך שיעורים מסומנים</p>
            <p className="text-xs text-ink-muted mb-6">
              סמן שיעורים בכפתור 🔖 בכל דף שיעור — וקבל תזכורת לפני שהם מתחילים.
            </p>
            <Link href="/lessons" className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition">
              גלו שיעורים
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="hebrew-serif text-xl font-bold text-ink mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                קרובים ({upcoming.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((b) => <BookmarkCard key={b.id} b={b} now={now} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="hebrew-serif text-xl font-bold text-ink mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-ink-muted" />
                שיעורים שעברו ({past.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 opacity-90">
                {past.map((b) => <BookmarkCard key={b.id} b={b} now={now} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookmarkCard({ b, now }: { b: any; now: Date }) {
  const l = b.lesson;
  const minsUntil = Math.floor((l.scheduledAt.getTime() - now.getTime()) / 60000);
  const upcoming = minsUntil > 0;
  return (
    <Card className="p-0 overflow-hidden">
      <Link href={`/lesson/${l.id}`} className="block relative h-32 bg-paper-soft overflow-hidden">
        {l.posterUrl ? (
          <Image src={l.posterUrl} alt={l.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover hover:scale-105 transition" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-paper-soft to-paper-warm">
            <LogoIcon className="w-16 h-16 opacity-40" />
          </div>
        )}
        {upcoming && minsUntil < 1440 && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-2 py-1 rounded-full">
            <Bell className="w-3 h-3" />
            {minsUntil < 60 ? `בעוד ${minsUntil} דק׳` : `בעוד ${Math.floor(minsUntil / 60)} שעות`}
          </span>
        )}
      </Link>
      <div className="p-4">
        <Link href={`/lesson/${l.id}`} className="block hover:text-primary transition">
          <h3 className="font-bold text-ink line-clamp-2 mb-1">{l.title}</h3>
        </Link>
        <p className="text-xs text-ink-muted truncate">{l.rabbi?.name ?? l.organizerName ?? "—"}</p>
        <p className="text-xs text-ink-muted mt-1">{formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}</p>
        <div className="mt-3 flex justify-between items-center">
          <BookmarkButton lessonId={l.id} initialBookmarked={true} initialRemindBefore={b.remindBeforeMin} canBookmark={true} />
        </div>
      </div>
    </Card>
  );
}
