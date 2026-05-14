import Image from "next/image";
import { Share2 } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { ContactRabbiButton } from "@/components/ContactRabbiButton";

type Props = {
  rabbi: {
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
    bio: string | null;
  };
  stats: { lessons: number; hours: number; followers: number };
  follow: { canFollow: boolean; isFollowing: boolean };
  contact: {
    canContact: boolean;
    isBlocked: boolean;
    userInfo?: { email?: string; phone?: string; name?: string };
  };
  shareText: string;
};

// Public hero for a rabbi profile: gradient cover, overlapping photo,
// name + inline stats + primary CTAs. Mobile-first, RTL.
export function HeroBlock({ rabbi, stats, follow, contact, shareText }: Props) {
  return (
    <header className="mb-8 -mx-4 sm:mx-0 sm:rounded-card overflow-hidden border-b sm:border border-border bg-white">
      {/* Cover */}
      <div
        className="relative h-32 sm:h-44 bg-gradient-to-bl from-primary/90 via-primary to-primary-hover overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="absolute inset-0 flex items-center justify-center hebrew-serif text-white/10 text-[5rem] sm:text-[8rem] font-bold select-none truncate px-4"
        >
          {rabbi.name}
        </span>
        <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="px-4 sm:px-6 pb-5 relative">
        {/* Photo — overlaps cover */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
          <div className="shrink-0 mx-auto sm:mx-0">
            {rabbi.photoUrl ? (
              rabbi.photoUrl.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rabbi.photoUrl}
                  alt={rabbi.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-soft bg-paper-soft"
                />
              ) : (
                <Image
                  src={rabbi.photoUrl}
                  alt={rabbi.name}
                  width={128}
                  height={128}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-soft bg-paper-soft"
                  priority
                />
              )
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-primary-soft border-4 border-white shadow-soft flex items-center justify-center hebrew-serif text-4xl text-primary">
                {rabbi.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-right pb-1">
            <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
              {rabbi.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-x-3 gap-y-1 flex-wrap justify-center sm:justify-start text-sm text-ink-muted">
              <span>
                <span className="font-semibold text-ink">{stats.lessons}</span>{" "}
                שיעורים
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="font-semibold text-ink">
                  {stats.hours.toFixed(0)}
                </span>{" "}
                שעות
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="font-semibold text-ink">
                  {stats.followers.toLocaleString("he-IL")}
                </span>{" "}
                עוקבים
              </span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div
          id="hero-ctas"
          className="mt-4 flex items-center justify-center sm:justify-start gap-2 flex-wrap"
        >
          <FollowButton
            rabbiId={rabbi.id}
            initialFollowing={follow.isFollowing}
            canFollow={follow.canFollow}
          />
          <ContactRabbiButton
            rabbiId={rabbi.id}
            canSend={contact.canContact}
            isBlocked={contact.isBlocked}
            userInfo={contact.userInfo}
          />
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-btn border border-border bg-white text-sm font-medium text-ink-soft hover:border-primary hover:text-primary transition"
            aria-label={`שתף את ${rabbi.name} ב-WhatsApp`}
          >
            <Share2 className="w-4 h-4" />
            שתף
          </a>
        </div>
      </div>
    </header>
  );
}
