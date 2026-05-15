import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import { LiveStarter } from "@/components/LiveStarter";
import { RecordingsList } from "@/components/RecordingsList";
import { StreamCodeBadge } from "@/components/StreamCodeBadge";
import { ExpirationCountdown } from "@/components/ExpirationCountdown";
import { Radio, Video, Download, Plus } from "lucide-react";

export default async function LivePage() {
  const { rabbi } = await requireApprovedRabbi();
  const now = new Date();
  // התחלת היום — שיעור של 14:00 שעכשיו 14:05 עדיין יחשב "עתידי" עד סוף היום
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // רק שיעורים מהיום והלאה ושעוד לא שודרו. שיעורים ששודרו עוברים לארכיון.
  // משאירים שיעורים שעדיין isLive=true גם אם streamId קיים (הם משדרים עכשיו).
  const lessons = await db.lesson.findMany({
    where: {
      rabbiId: rabbi.id,
      scheduledAt: { gte: startOfToday },
      broadcastType: { not: "PREP" },
      // לא הוצג בארכיון אם: עדיין משדר (isLive=true) או מעולם לא שודר (streamId=null)
      OR: [
        { isLive: true },
        { streamId: null },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    take: 30,
  });

  const liveNow = lessons.filter((l) => l.isLive);
  const upcoming = lessons.filter((l) => !l.isLive);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Radio className="w-7 h-7 text-live" />
          <h1 className="hebrew-serif text-3xl font-bold">שידור חי</h1>
        </div>
        <Link
          href="/dashboard/lessons/new"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition"
        >
          <Plus className="w-4 h-4" />
          צור שיעור חדש
        </Link>
      </div>

      {/* שידורים פעילים */}
      {liveNow.length > 0 && (
        <section>
          <h2 className="hebrew-serif text-xl font-bold mb-3 text-live">משדר עכשיו</h2>
          <div className="space-y-3">
            {liveNow.map((l) => (
              <Card key={l.id} className="border-live">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{l.title}</CardTitle>
                    <div className="text-sm text-ink-muted">
                      {formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">
                      מסלול: {l.liveMethod === "BROWSER" ? "שידור מהדפדפן" : l.liveMethod === "YOUTUBE" ? "YouTube" : "קישור חיצוני"}
                    </div>
                  </div>
                  <LiveStarter
                    lessonId={l.id}
                    lessonTitle={l.title}
                    lessonDate={`${formatHebrewDate(l.scheduledAt)} · ${formatHebrewTime(l.scheduledAt)}`}
                    isLive={true}
                    currentMethod={l.liveMethod ?? undefined}
                    liveStartedAt={l.updatedAt ? new Date(l.updatedAt).toISOString() : null}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* שיעורים קרובים — בחירת מסלול */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="hebrew-serif text-xl font-bold">שיעורים קרובים — התחל שידור</h2>
          <Link href="/dashboard/lessons" className="text-sm text-primary hover:underline">
            שיעורים שעברו והקלטות ←
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <Card><CardDescription>אין שיעורים מתוכננים. צור שיעור חדש כדי להתחיל לשדר.</CardDescription></Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((l) => (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <CardTitle>{l.title}</CardTitle>
                    <div className="text-sm text-ink-muted">
                      {formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}
                    </div>
                  </div>
                  <LiveStarter
                    lessonId={l.id}
                    lessonTitle={l.title}
                    lessonDate={`${formatHebrewDate(l.scheduledAt)} · ${formatHebrewTime(l.scheduledAt)}`}
                    isLive={false}
                  />
                </div>
                {(l as any).streamCode && (
                  <div className="mt-3">
                    <StreamCodeBadge
                      code={(l as any).streamCode}
                      lessonTitle={l.title}
                      lessonUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/lesson/${l.id}`}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* הסבר */}
      <Card className="bg-paper-warm border-border-warm">
        <h3 className="font-bold text-ink mb-3">2 דרכים לשדר</h3>
        <div className="space-y-3 text-sm text-ink-soft">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-ink">שידור מהדפדפן</div>
              <div>לוחץ "שדר מהדפדפן" → המצלמה נדלקת → הצופים רואים ישירות באתר. ההקלטה נשמרת 30 יום להורדה. ללא התקנות.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-ink">קישור חיצוני (YouTube / Zoom / אחר)</div>
              <div>מדביק לינק של שידור חי. YouTube מזוהה אוטומטית ומוטמע באתר; Zoom וקישורים אחרים — אם ניתן embed מוצגים באתר, אחרת כפתור מעבר.</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
