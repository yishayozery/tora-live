type Lesson = {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  durationMin: number | null;
  isLive: boolean;
  posterUrl: string | null;
  youtubeUrl: string | null;
  liveEmbedUrl: string | null;
  locationName: string | null;
  rabbi?: { name: string; slug: string } | null;
  organizerName?: string | null;
};

const SITE = "https://tora-live.co.il";

/**
 * JSON-LD structured data for Google rich results.
 * Live broadcasts → BroadcastEvent. Recordings → VideoObject. Events → Event.
 */
export function LessonStructuredData({ lesson }: { lesson: Lesson }) {
  const rabbiName = lesson.rabbi?.name ?? lesson.organizerName ?? "TORA_LIVE";
  const url = `${SITE}/lesson/${lesson.id}`;
  const startTime = lesson.scheduledAt.toISOString();
  const endTime = lesson.durationMin
    ? new Date(lesson.scheduledAt.getTime() + lesson.durationMin * 60_000).toISOString()
    : undefined;

  // Use VideoObject for video content (most lessons), Event for in-person
  const data: any = {
    "@context": "https://schema.org",
    "@type": lesson.isLive || lesson.youtubeUrl || lesson.liveEmbedUrl ? "VideoObject" : "Event",
    name: lesson.title,
    description: lesson.description.slice(0, 500),
    url,
    inLanguage: "he-IL",
  };

  if (lesson.posterUrl) data.thumbnailUrl = lesson.posterUrl;
  if (lesson.youtubeUrl) data.contentUrl = lesson.youtubeUrl;
  // Always include embedUrl pointing to our lesson page (required for VideoObject rich results)
  data.embedUrl = lesson.liveEmbedUrl || url;

  if (data["@type"] === "VideoObject") {
    data.uploadDate = lesson.scheduledAt.toISOString();
    if (endTime && startTime) {
      // duration in ISO 8601 format: PT1H30M
      const totalMin = lesson.durationMin ?? 60;
      data.duration = `PT${Math.floor(totalMin / 60)}H${totalMin % 60}M`;
    }
    data.isAccessibleForFree = true;
    data.publisher = {
      "@type": "Organization",
      name: "TORA_LIVE",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo.png`,
      },
    };
    data.author = lesson.rabbi
      ? {
          "@type": "Person",
          name: `הרב ${rabbiName}`,
          url: `${SITE}/rabbi/${lesson.rabbi.slug}`,
        }
      : { "@type": "Person", name: rabbiName };
    if (lesson.isLive) {
      data.publication = {
        "@type": "BroadcastEvent",
        isLiveBroadcast: true,
        startDate: startTime,
        ...(endTime ? { endDate: endTime } : {}),
      };
    }
  } else {
    // Event
    data.startDate = startTime;
    if (endTime) data.endDate = endTime;
    data.eventStatus = "https://schema.org/EventScheduled";
    data.eventAttendanceMode = lesson.locationName
      ? "https://schema.org/OfflineEventAttendanceMode"
      : "https://schema.org/OnlineEventAttendanceMode";
    data.location = lesson.locationName
      ? { "@type": "Place", name: lesson.locationName, address: lesson.locationName }
      : { "@type": "VirtualLocation", url };
    data.organizer = { "@type": "Person", name: rabbiName };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
