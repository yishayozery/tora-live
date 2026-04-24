"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardDescription } from "@/components/ui/Card";
import { Heart, Search, BookOpen, MessageSquare, Radio, CalendarClock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { BROADCAST_TYPES, broadcastTypeLabel } from "@/lib/enums";

type RabbiCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  lessonsCount: number;
  followersCount: number;
  upcomingCount: number;
  hasLive: boolean;
  isFollowing: boolean;
  categories: string[];
  broadcastTypes: string[];
};

type FollowFilter = "all" | "following" | "discover";

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
  const [typeFilter, setTypeFilter] = useState<string>(""); // LESSON/PRAYER/OTHER
  const [followFilter, setFollowFilter] = useState<FollowFilter>("all");
  const [onlyLive, setOnlyLive] = useState(false);
  const [followState, setFollowState] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      for (const r of rabbis) map[r.id] = r.isFollowing;
      return map;
    }
  );
  const [pending, start] = useTransition();

  // אפשרויות סוגי שידור שבאמת קיימים אצל הרבנים
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    rabbis.forEach((r) => r.broadcastTypes.forEach((t) => set.add(t)));
    return BROADCAST_TYPES.filter((b) => set.has(b.value));
  }, [rabbis]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rabbis.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.bio.toLowerCase().includes(q)) return false;
      if (categoryFilter && !r.categories.includes(categoryFilter)) return false;
      if (typeFilter && !r.broadcastTypes.includes(typeFilter)) return false;
      if (onlyLive && !r.hasLive) return false;
      if (followFilter === "following" && !followState[r.id]) return false;
      if (followFilter === "discover" && followState[r.id]) return false;
      return true;
    });
  }, [rabbis, query, categoryFilter, typeFilter, onlyLive, followFilter, followState]);

  const followingCount = rabbis.filter((r) => followState[r.id]).length;
  const discoverCount = rabbis.length - followingCount;

  const hasActiveFilter = !!(query || categoryFilter || typeFilter || onlyLive || followFilter !== "all");
  const clearAll = () => {
    setQuery("");
    setCategoryFilter("");
    setTypeFilter("");
    setOnlyLive(false);
    setFollowFilter("all");
  };

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
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h1 className="hebrew-serif text-3xl font-bold">הרבנים שלי</h1>
        <div className="text-sm text-ink-muted">
          עוקב אחרי <strong className="text-primary">{followingCount}</strong> רבנים
        </div>
      </div>

      {/* === סרגל פילטרים מודגש === */}
      <div className="bg-white border-2 border-primary/30 rounded-card shadow-card overflow-hidden">
        {/* Header צבעוני */}
        <div className="bg-gradient-to-l from-primary-soft via-primary-soft/40 to-transparent border-b border-primary/20 px-4 sm:px-5 py-2.5 flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/15">
            <Filter className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-ink">סינון וחיפוש רבנים</h3>
          <span className="mr-auto inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
            {filtered.length} / {rabbis.length}
          </span>
        </div>

        {/* גוף */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* שורה 1: חיפוש + follow tabs */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative w-full sm:w-56">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חפש לפי שם או תיאור..."
                className="w-full h-10 pr-10 pl-3 rounded-btn border border-border bg-white text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* עוקב/לא עוקב */}
            <div className="flex gap-1 p-1 bg-paper-soft rounded-btn border border-border" role="group" aria-label="סינון עוקב">
              {[
                { v: "all" as FollowFilter, label: `הכל (${rabbis.length})` },
                { v: "following" as FollowFilter, label: `עוקב (${followingCount})` },
                { v: "discover" as FollowFilter, label: `גלה (${discoverCount})` },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setFollowFilter(opt.v)}
                  className={cn(
                    "h-8 px-3 text-sm font-medium rounded-btn transition",
                    followFilter === opt.v ? "bg-primary text-white" : "text-ink-soft hover:text-ink hover:bg-white"
                  )}
                  aria-pressed={followFilter === opt.v}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-white text-sm text-ink-soft hover:border-live hover:text-live cursor-pointer transition">
              <input
                type="checkbox"
                checked={onlyLive}
                onChange={(e) => setOnlyLive(e.target.checked)}
                className="w-3.5 h-3.5 accent-live"
              />
              <Radio className="w-3.5 h-3.5" />
              בשידור עכשיו
            </label>
          </div>

          {/* שורה 2: chips לסוג שידור */}
          {availableTypes.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <span className="text-xs text-ink-muted self-center ml-1">סוג:</span>
              {availableTypes.map((t) => {
                const active = typeFilter === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTypeFilter(active ? "" : t.value)}
                    className={cn(
                      "h-8 px-3 rounded-full text-sm font-medium border transition",
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border text-ink-soft hover:border-primary hover:text-primary"
                    )}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* שורה 3: קטגוריה + נקה */}
          <div className="flex gap-2 flex-wrap items-center">
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={cn(
                  "h-9 px-3 rounded-btn border text-sm bg-white transition",
                  categoryFilter ? "border-primary text-primary font-medium" : "border-border text-ink-soft"
                )}
                aria-label="קטגוריה"
              >
                <option value="">כל הקטגוריות</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="h-9 px-3 rounded-btn text-sm text-primary hover:underline font-medium mr-auto"
              >
                נקה סינון
              </button>
            )}
          </div>
        </div>
      </div>

      {/* רשימה */}
      {filtered.length === 0 ? (
        <Card>
          <CardDescription>
            לא נמצאו רבנים התואמים את הסינון.{" "}
            {hasActiveFilter && (
              <button onClick={clearAll} className="text-primary hover:underline font-medium">
                נקה סינון
              </button>
            )}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RabbiCardItem
              key={r.id}
              rabbi={r}
              isFollowing={followState[r.id]}
              onToggle={() => toggleFollow(r.id)}
              disabled={pending}
            />
          ))}
        </div>
      )}
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
  const initials = rabbi.name
    .replace("הרב ", "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <Card className="flex flex-col justify-between p-4">
      <div>
        {/* Header: תמונה + שם */}
        <div className="flex items-start gap-3">
          {rabbi.photoUrl ? (
            rabbi.photoUrl.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rabbi.photoUrl} alt={rabbi.name} className="w-14 h-14 shrink-0 rounded-full object-cover ring-2 ring-gold-soft" />
            ) : (
              <Image
                src={rabbi.photoUrl}
                alt={rabbi.name}
                width={56}
                height={56}
                className="w-14 h-14 shrink-0 rounded-full object-cover ring-2 ring-gold-soft"
              />
            )
          ) : (
            <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-gold-soft to-gold/30 flex items-center justify-center hebrew-serif font-bold text-xl text-gold ring-2 ring-gold-soft">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/rabbi/${rabbi.slug}`}
              className="font-bold text-ink hover:text-primary transition leading-tight block"
            >
              {rabbi.name}
            </Link>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {rabbi.hasLive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-live rounded-full px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              )}
              {isFollowing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                  <Heart className="w-2.5 h-2.5 fill-current" />
                  עוקב
                </span>
              )}
            </div>
          </div>
        </div>

        {rabbi.bio && (
          <p className="text-xs text-ink-muted line-clamp-2 mt-2">{rabbi.bio}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-ink-muted mt-3">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {rabbi.lessonsCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {rabbi.followersCount}
          </span>
          {rabbi.upcomingCount > 0 && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <CalendarClock className="w-3 h-3" /> {rabbi.upcomingCount} קרובים
            </span>
          )}
        </div>
      </div>

      {/* פעולות */}
      <div className="mt-3 flex gap-1.5">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "h-8 px-3 inline-flex items-center gap-1.5 rounded-btn text-xs font-medium transition flex-1 justify-center",
            isFollowing
              ? "bg-primary-soft text-primary border border-primary/20 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
              : "bg-primary text-white hover:bg-primary-hover"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", isFollowing && "fill-current")} />
          {isFollowing ? "עוקב" : "עקוב"}
        </button>

        {isFollowing && (
          <Link
            href={`/rabbi/${rabbi.slug}#contact`}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-btn text-xs font-medium border border-border bg-white text-ink-soft hover:border-primary hover:text-primary transition"
            title="שלח הודעה לרב"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            הודעה
          </Link>
        )}
      </div>
    </Card>
  );
}
