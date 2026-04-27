"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, BookOpen, Users, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/Card";

type Rabbi = {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  bioFirstLine: string;
  lessonsCount: number;
  followersCount: number;
  isFollowing: boolean;
};

export function AskRabbiSearch({ rabbis }: { rabbis: Rabbi[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "following">(rabbis.some((r) => r.isFollowing) ? "following" : "all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rabbis.filter((r) => {
      if (filter === "following" && !r.isFollowing) return false;
      if (q) {
        return (
          r.name.toLowerCase().includes(q) ||
          r.bioFirstLine.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rabbis, query, filter]);

  const followingCount = rabbis.filter((r) => r.isFollowing).length;

  return (
    <div className="space-y-4">
      {/* חיפוש + טאבים */}
      <div className="bg-white border-2 border-primary/30 rounded-card shadow-card p-3 sm:p-4 space-y-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם או תחום..."
            className="w-full h-11 pr-10 pl-3 rounded-btn border border-border bg-paper-soft text-sm focus:bg-white focus:border-primary focus:outline-none"
          />
        </div>

        {followingCount > 0 && (
          <div className="flex gap-1 p-1 bg-paper-soft rounded-btn border border-border w-fit" role="group">
            <button
              type="button"
              onClick={() => setFilter("following")}
              className={`h-8 px-3 text-sm font-medium rounded-btn transition ${filter === "following" ? "bg-primary text-white" : "text-ink-soft hover:text-ink"}`}
            >
              <Heart className={`w-3.5 h-3.5 inline mr-1 ${filter === "following" ? "fill-current" : ""}`} />
              עוקב ({followingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`h-8 px-3 text-sm font-medium rounded-btn transition ${filter === "all" ? "bg-primary text-white" : "text-ink-soft hover:text-ink"}`}
            >
              כל הרבנים ({rabbis.length})
            </button>
          </div>
        )}

        <div className="text-xs text-ink-muted">
          מציג {filtered.length} רבנים
        </div>
      </div>

      {/* תצוגת תוצאות */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-ink-muted py-6">
            לא נמצאו רבנים התואמים את החיפוש.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/ask-rabbi/${r.id}`}
              className="block bg-white border border-border rounded-card p-4 hover:border-primary hover:shadow-soft transition group"
            >
              <div className="flex items-start gap-3">
                {/* תמונת הרב — חשובה למניעת בלבול */}
                {r.photoUrl ? (
                  r.photoUrl.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photoUrl}
                      alt={r.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gold-soft shrink-0"
                    />
                  ) : (
                    <Image
                      src={r.photoUrl}
                      alt={r.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gold-soft shrink-0"
                    />
                  )
                ) : (
                  <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-gold-soft to-gold/30 flex items-center justify-center hebrew-serif font-bold text-xl text-gold ring-2 ring-gold-soft">
                    {r.name.replace("הרב ", "").charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink group-hover:text-primary transition leading-tight">
                      {r.name}
                    </h3>
                    {r.isFollowing && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5">
                        <Heart className="w-2.5 h-2.5 fill-current" /> עוקב
                      </span>
                    )}
                  </div>
                  {/* שורת תיאור — חשוב למניעת בלבול בין רבנים בעלי שם דומה */}
                  {r.bioFirstLine && (
                    <p className="text-xs text-ink-muted line-clamp-2 mt-1">{r.bioFirstLine}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-ink-muted mt-2">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {r.lessonsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {r.followersCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-xs text-primary group-hover:translate-x-1 transition">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>שלח הודעה ←</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
