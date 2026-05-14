import Link from "next/link";
import Image from "next/image";
import { FollowButton } from "@/components/FollowButton";
import { pluralize } from "@/lib/utils";

interface Props {
  rabbi: {
    id: string;
    slug: string;
    name: string;
    bio?: string | null;
    photoUrl?: string | null;
  };
  upcomingCount?: number;
  isFollowing: boolean;
  canFollow: boolean;
}

/**
 * כרטיס רב צמוד לעמוד שיעור — דוחף את האורח לעקוב + לבנות לוח אישי.
 */
export function LessonRabbiCard({ rabbi, upcomingCount = 0, isFollowing, canFollow }: Props) {
  const tagline = (rabbi.bio ?? "").split("\n")[0]?.trim();
  return (
    <aside className="rounded-card border border-border bg-white p-4 shadow-soft">
      <Link
        href={`/rabbi/${rabbi.slug}`}
        className="flex items-center gap-3 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-btn -m-1 p-1"
      >
        <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden bg-paper-soft border border-border">
          {rabbi.photoUrl ? (
            <Image
              src={rabbi.photoUrl}
              alt={rabbi.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-bold text-lg">
              {rabbi.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-ink group-hover:text-primary transition truncate">
            הרב {rabbi.name}
          </div>
          {tagline && (
            <div className="text-xs text-ink-muted line-clamp-1">{tagline}</div>
          )}
        </div>
      </Link>

      {upcomingCount > 0 && (
        <div className="mt-3 text-xs text-ink-soft">
          {pluralize(upcomingCount, "שיעור קרוב", "שיעורים קרובים")}
        </div>
      )}

      <div className="mt-3">
        <FollowButton
          rabbiId={rabbi.id}
          initialFollowing={isFollowing}
          canFollow={canFollow}
        />
      </div>
    </aside>
  );
}
