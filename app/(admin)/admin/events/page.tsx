import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription } from "@/components/ui/Card";
import { EventApprovalActions } from "@/components/admin/EventApprovalActions";
import { formatHebrewDate, formatHebrewTime } from "@/lib/utils";
import Link from "next/link";
import { MapPin, FileImage, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await requireAdmin();

  const [pending, recentApproved] = await Promise.all([
    db.lesson.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        organizer: { select: { email: true } },
        rabbi: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lesson.findMany({
      where: { approvalStatus: "APPROVED", organizerUserId: { not: null } },
      include: {
        organizer: { select: { email: true } },
        rabbi: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="hebrew-serif text-3xl font-bold mb-4">
          אירועים ממתינים לאישור{" "}
          <span className="text-ink-muted text-lg">({pending.length})</span>
        </h1>
        {pending.length === 0 ? (
          <Card>
            <CardDescription>אין אירועים ממתינים.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((l) => (
              <EventCard key={l.id} lesson={l} showActions />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-4">אושרו לאחרונה</h2>
        {recentApproved.length === 0 ? (
          <Card>
            <CardDescription>אין אירועים שאושרו לאחרונה.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentApproved.map((l) => (
              <EventCard key={l.id} lesson={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type LessonWithOrg = {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  locationName: string | null;
  locationUrl: string | null;
  posterUrl: string | null;
  liveEmbedUrl: string | null;
  organizerName: string | null;
  organizer: { email: string } | null;
  rabbi: { name: string } | null;
};

function EventCard({
  lesson: l,
  showActions,
}: {
  lesson: LessonWithOrg;
  showActions?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="hebrew-serif text-xl font-bold text-ink">{l.title}</h3>
          </div>
          <div className="text-sm text-ink-muted">
            {formatHebrewDate(l.scheduledAt)} · {formatHebrewTime(l.scheduledAt)}
          </div>
          <p className="text-sm mt-2 whitespace-pre-line text-ink-soft">
            {l.description}
          </p>
          <div className="mt-3 text-xs text-ink-muted space-y-1">
            <div>
              מארגן:{" "}
              <span className="font-medium text-ink">
                {l.organizerName || l.rabbi?.name || "—"}
              </span>
              {l.organizer?.email && (
                <span className="text-ink-muted" dir="ltr">
                  {" "}· {l.organizer.email}
                </span>
              )}
            </div>
            {l.locationName && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{l.locationName}</span>
                {l.locationUrl && (
                  <a
                    href={l.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline mr-2"
                  >
                    במפה ←
                  </a>
                )}
              </div>
            )}
            {l.posterUrl && (
              <div className="flex items-center gap-1">
                <FileImage className="w-3 h-3" />
                <a
                  href={l.posterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  פוסטר
                </a>
              </div>
            )}
            {l.liveEmbedUrl && (
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <a
                  href={l.liveEmbedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  קישור לשידור
                </a>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs">
            <Link href={`/lesson/${l.id}`} className="text-primary hover:underline">
              לדף השיעור ←
            </Link>
          </div>
        </div>
        {showActions && <EventApprovalActions id={l.id} />}
      </div>
    </Card>
  );
}
