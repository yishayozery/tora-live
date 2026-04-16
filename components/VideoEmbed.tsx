"use client";

/**
 * ממיר URL של YouTube ל-embed URL.
 * תומך ב: youtube.com/watch?v=, youtu.be/, youtube.com/live/, youtube.com/embed/
 */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1`;
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
    }
    // youtube.com/live/ID
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/live/")) {
      const id = u.pathname.replace("/live/", "");
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    // youtube.com/embed/ID — כבר embed
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) {
      return url;
    }
    // Zoom / אחר — לא embed-able, נחזיר null
    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const embedUrl = toEmbedUrl(url);

  if (!embedUrl) {
    // לינק לא embeddable — מציג כפתור מעבר
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-card border border-live bg-live/5 p-8 text-center hover:shadow-soft transition"
      >
        <div className="text-live font-bold text-lg">צפה בשידור החי</div>
        <div className="text-sm text-ink-muted mt-1">לחץ לפתיחה בחלון חדש</div>
      </a>
    );
  }

  return (
    <div className="rounded-card overflow-hidden border border-border shadow-soft">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          title={title || "שידור חי"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
