"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardDescription } from "@/components/ui/Card";
import { Heart, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type RabbiCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  lessonsCount: number;
  followersCount: number;
  isFollowing: boolean;
  categories: string[];
};

export function RabbisClient({
  rabbis,
  categories,
}: {
  rabbis: RabbiCard[];
  categories: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [followState, setFollowState] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      for (const r of rabbis) map[r.id] = r.isFollowing;
      return map;
    }
  );
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rabbis.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.bio.toLowerCase().includes(q)) return false;
      if (categoryFilter && !r.categories.includes(categoryFilter)) return false;
      return true;
    });
  }, [rabbis, query, categoryFilter]);

  const following = filtered.filter((r) => followState[r.id]);
  const discover = filtered.filter((r) => !followState[r.id]);

  function toggleFollow(rabbiId: string) {
    const isFollowing = followState[rabbiId];
    start(async () => {
      const res = await fetch(`/api/follow/${rabbiId}`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowState((prev) => ({ ...prev, [rabbiId]: !isFollowing }));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="hebrew-serif text-3xl font-bold">רבנים</h1>

      {/* חיפוש + פילטר */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="חיפוש לפי שם רב..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-white text-sm"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 px-3 rounded-btn border border-border bg-white text-sm min-w-[160px]"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* רבנים שאני עוקב */}
      <section>
        <h2 className="hebrew-serif text-xl font-bold mb-3">
          רבנים שאני עוקב <span className="text-ink-muted text-sm">({following.length})</span>
        </h2>
        {following.length === 0 ? (
          <Card>
            <CardDescription>
              {query || categoryFilter
                ? "לא נמצאו רבנים שאתה עוקב התואמים את החיפוש."
                : "עוד לא עוקב אחרי אף רב. גלה רבנים למטה!"}
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {following.map((r) => (
              <RabbiCardItem
                key={r.id}
                rabbi={r}
                isFollowing={true}
                onToggle={() => toggleFollow(r.id)}
                disabled={pending}
              />
            ))}
          </div>
        )}
      </section>

      {/* גלה רבנים חדשים */}
      <section>
        <h2 className="hebrew-serif text-xl font-bold mb-3">
          גלה רבנים חדשים <span className="text-ink-muted text-sm">({discover.length})</span>
        </h2>
        {discover.length === 0 ? (
          <Card>
            <CardDescription>
              {query || categoryFilter
                ? "לא נמצאו רבנים נוספים התואמים את החיפוש."
                : "אתה עוקב אחרי כל הרבנים!"}
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {discover.map((r) => (
              <RabbiCardItem
                key={r.id}
                rabbi={r}
                isFollowing={false}
                onToggle={() => toggleFollow(r.id)}
                disabled={pending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RabbiCardItem({
  rabbi,
  isFollowing,
  onToggle,
  disabled,
}: {
  rabbi: RabbiCard;
  isFollowing: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <Link
          href={`/rabbi/${rabbi.slug}`}
          className="font-bold text-ink hover:text-primary transition"
        >
          {rabbi.name}
        </Link>
        <div className="text-sm text-ink-muted line-clamp-2 mt-1">{rabbi.bio}</div>
        <div className="flex items-center gap-3 text-xs text-ink-subtle mt-2">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {rabbi.lessonsCount} שיעורים
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {rabbi.followersCount} עוקבים
          </span>
        </div>
      </div>
      <div className="mt-3">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "h-8 px-3 inline-flex items-center gap-1.5 rounded-btn text-xs font-medium transition",
            isFollowing
              ? "bg-primary-soft text-primary border border-primary/20 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
              : "bg-primary text-white hover:bg-primary-hover"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", isFollowing && "fill-current")} />
          {isFollowing ? "הסר מעקב" : "עקוב"}
        </button>
      </div>
    </Card>
  );
}
