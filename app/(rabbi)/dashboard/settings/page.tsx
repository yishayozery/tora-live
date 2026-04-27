import { requireRabbi } from "@/lib/session";
import { RabbiProfileForm } from "@/components/RabbiProfileForm";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function SettingsPage() {
  const { rabbi } = await requireRabbi();

  let media: Record<string, string> = {};
  try {
    if (rabbi.mediaLinks) media = JSON.parse(rabbi.mediaLinks);
  } catch {}

  return (
    <div className="max-w-2xl">
      <h1 className="hebrew-serif text-3xl font-bold mb-2">הגדרות הפרופיל</h1>
      <p className="text-ink-muted mb-6 text-sm">
        המידע כאן מוצג בדף הרב הציבורי שלך: <span dir="ltr" className="font-mono text-xs">/rabbi/{rabbi.slug}</span>
      </p>
      <RabbiProfileForm
        rabbiName={rabbi.name}
        initial={{
          bio: rabbi.bio ?? "",
          slug: rabbi.slug,
          photoUrl: rabbi.photoUrl ?? null,
          liveMode: (rabbi.liveMode as "OWN" | "PLATFORM") ?? "OWN",
          media: {
            youtube: media.youtube ?? "",
            spotify: media.spotify ?? "",
            applePodcast: media.applePodcast ?? "",
            soundcloud: media.soundcloud ?? "",
            facebook: media.facebook ?? "",
            website: media.website ?? "",
            other: media.other ?? "",
          },
          autoReplyEnabled: (rabbi as any).autoReplyEnabled ?? false,
          autoReplyMessage: (rabbi as any).autoReplyMessage ?? "",
        }}
      />

      <div className="mt-8">
        <CategoriesManager />
      </div>
    </div>
  );
}
