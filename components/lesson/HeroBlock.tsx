import Image from "next/image";
import { Radio, PlayCircle, ExternalLink } from "lucide-react";
import { VideoEmbed } from "@/components/VideoEmbed";
import { LessonCountdown } from "@/components/lesson/LessonCountdown";
import { determineHeroState, pickExternalLiveUrl, type HeroState } from "@/lib/lesson/hero-state";

interface Props {
  lesson: {
    id: string;
    title: string;
    scheduledAt: Date | string;
    durationMin?: number | null;
    isLive: boolean;
    liveMethod?: string | null;
    playbackUrl?: string | null;
    liveEmbedUrl?: string | null;
    recordingExpiry?: Date | string | null;
    youtubeUrl?: string | null;
    otherUrl?: string | null;
    posterUrl?: string | null;
  };
  rabbi?: {
    name: string;
    photoUrl?: string | null;
  } | null;
}

/**
 * Hero של עמוד שיעור — 4 מצבים:
 *  LIVE     — נגן/iframe דומיננטי + תג פולס
 *  ENDED_REC— נגן הקלטה
 *  EXTERNAL — תמונת cover + CTA "כנס לשידור" + countdown
 *  UPCOMING — תמונת cover + countdown + bookmark CTA (חיצוני)
 */
export function HeroBlock({ lesson, rabbi }: Props) {
  const state: HeroState = determineHeroState({
    isLive: lesson.isLive,
    scheduledAt: lesson.scheduledAt,
    durationMin: lesson.durationMin,
    playbackUrl: lesson.playbackUrl,
    liveEmbedUrl: lesson.liveEmbedUrl,
    recordingExpiry: lesson.recordingExpiry,
    youtubeUrl: lesson.youtubeUrl,
    otherUrl: lesson.otherUrl,
  });

  if (state === "LIVE") {
    // עדיפות: BROWSER+playback → embed יוטיוב/Zoom → URL חיצוני (button)
    const externalLink = pickExternalLiveUrl({
      liveEmbedUrl: lesson.liveEmbedUrl,
      youtubeUrl: lesson.youtubeUrl,
      otherUrl: lesson.otherUrl,
    });

    return (
      <div className="relative rounded-card overflow-hidden border-2 border-live shadow-soft">
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-live px-3 py-1 text-xs font-bold text-white shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          משדר עכשיו
        </span>

        {lesson.liveMethod === "BROWSER" && lesson.playbackUrl ? (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={lesson.liveEmbedUrl || lesson.playbackUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : lesson.liveEmbedUrl ? (
          <VideoEmbed url={lesson.liveEmbedUrl} title={lesson.title} />
        ) : externalLink ? (
          // אין embed זמין — מציגים cover + CTA לקישור חיצוני (Zoom וכו׳ שלא ניתן להטמעה)
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {lesson.posterUrl ? (
              <Image src={lesson.posterUrl} alt={lesson.title} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" priority />
            ) : rabbi?.photoUrl ? (
              <Image src={rabbi.photoUrl} alt={rabbi.name} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-live via-primary to-gold" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-5 sm:p-7">
              <div className="hebrew-serif text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow">
                {lesson.title}
              </div>
              <a
                href={externalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-btn bg-live hover:bg-live/90 text-white text-base font-bold shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PlayCircle className="w-5 h-5" />
                כנס לשידור החי ←
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>
          </div>
        ) : (
          // משדר אבל אין שום קישור — fallback ניטרלי
          <div className="relative w-full bg-paper-warm flex items-center justify-center text-center p-8" style={{ minHeight: "300px" }}>
            <div>
              <Radio className="w-12 h-12 text-live mx-auto mb-3 animate-pulse" />
              <p className="text-ink font-semibold">השידור החי החל אבל אנו עדיין מקבלים את הסטרים…</p>
              <p className="text-sm text-ink-muted mt-1">נסה לרענן את הדף בעוד 10-20 שניות.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state === "ENDED_REC") {
    const url = lesson.liveEmbedUrl || lesson.playbackUrl || lesson.youtubeUrl;
    if (!url) return null;
    return (
      <div className="rounded-card overflow-hidden border border-border shadow-soft">
        {lesson.playbackUrl && lesson.liveMethod === "BROWSER" ? (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={lesson.liveEmbedUrl || lesson.playbackUrl}
              title={`${lesson.title} — הקלטה`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <VideoEmbed url={url} title={lesson.title} />
        )}
      </div>
    );
  }

  // EXTERNAL / UPCOMING — cover hero
  const externalUrl = pickExternalLiveUrl({
    liveEmbedUrl: lesson.liveEmbedUrl,
    youtubeUrl: lesson.youtubeUrl,
    otherUrl: lesson.otherUrl,
  });

  return (
    <div className="relative rounded-card overflow-hidden border border-border shadow-soft">
      {/* רקע: poster של שיעור או photo של רב או gradient */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%", maxHeight: "70vh" }}>
        {lesson.posterUrl ? (
          <Image
            src={lesson.posterUrl}
            alt={lesson.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            priority
          />
        ) : rabbi?.photoUrl ? (
          <Image
            src={rabbi.photoUrl}
            alt={rabbi.name}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-gold" />
        )}
        {/* overlay לטקסט */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
          {rabbi?.name && (
            <div className="text-white/90 text-sm sm:text-base mb-1 font-medium">
              {rabbi.name}
            </div>
          )}
          <div className="hebrew-serif text-2xl sm:text-4xl font-bold text-white leading-tight mb-3 drop-shadow" aria-hidden>
            {lesson.title}
          </div>
          <div className="mb-4">
            <LessonCountdown
              scheduledAt={lesson.scheduledAt}
              className="!text-white bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
            />
          </div>

          {state === "EXTERNAL" && externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-btn bg-live hover:bg-live/90 text-white text-base font-bold shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white self-start max-w-full"
            >
              <PlayCircle className="w-5 h-5" />
              כנס לשידור ←
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 self-start bg-white/10 backdrop-blur-sm text-white/95 rounded-btn px-4 h-12 text-sm font-medium">
              <Radio className="w-4 h-4" />
              השידור יפתח כאן כשיתחיל
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
