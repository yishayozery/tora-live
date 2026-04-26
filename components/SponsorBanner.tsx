import Link from "next/link";
import { Heart } from "lucide-react";

export type SponsorInfo = {
  dedicationType: "LEZECHER" | "LIZCHUT" | null;
  name: string | null;
  donorName?: string | null;
};

export function SponsorBanner({ sponsor }: { sponsor: SponsorInfo | null }) {
  const hasSponsor = sponsor && sponsor.name;

  return (
    <div className="sticky top-16 z-20 bg-gradient-to-l from-gold-soft via-gold-soft/60 to-paper-warm border-b border-gold/30 shadow-sm backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4 flex-wrap text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0 text-ink">
          <Heart className="w-4 h-4 text-gold fill-gold shrink-0" />
          {hasSponsor ? (
            <p className="truncate">
              <span className="text-ink-muted">השיעורים היום מוקדשים</span>{" "}
              <span className="font-bold hebrew-serif">
                {sponsor.dedicationType === "LIZCHUT" ? "לזכות" : "לזכר"} {sponsor.name}
              </span>
              {sponsor.donorName && (
                <span className="text-ink-muted"> · בתרומת {sponsor.donorName}</span>
              )}
            </p>
          ) : (
            <p className="text-ink-muted">
              השיעורים היום יכולים להיות מוקדשים <span className="text-ink">לזכר או לזכות יקיריך</span>
            </p>
          )}
        </div>
        <Link
          href="/donate"
          className="text-gold hover:text-ink font-semibold shrink-0 underline underline-offset-4 decoration-gold/40"
        >
          הקדש שיעור ←
        </Link>
      </div>
    </div>
  );
}
