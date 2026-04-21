"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, User, BookOpen, Tag, Loader2, X } from "lucide-react";

type RabbiResult = { type: "rabbi"; name: string; slug: string; photoUrl: string | null; lessonCount: number; href: string };
type LessonResult = { type: "lesson"; id: string; title: string; rabbiName: string; scheduledAt: string; broadcastType: string; href: string };
type TopicResult = { type: "topic"; name: string; lessonCount: number; href: string };

type SearchResults = {
  rabbis: RabbiResult[];
  lessons: LessonResult[];
  topics: TopicResult[];
};

export function SearchAutocomplete({ placeholder = "חפש שיעור, רב, או נושא…" }: { placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>({ rabbis: [], lessons: [], topics: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ rabbis: [], lessons: [], topics: [] });
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ rabbis: [], lessons: [], topics: [] });
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  // Click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Flat list of all hrefs for keyboard nav
  const allItems = [...results.rabbis, ...results.lessons, ...results.topics];

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && allItems[activeIdx]) {
        router.push(allItems[activeIdx].href);
        setOpen(false);
      } else if (q.trim()) {
        router.push(`/lessons?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const totalResults = results.rabbis.length + results.lessons.length + results.topics.length;
  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showDropdown}
          className="w-full h-14 pr-12 pl-12 rounded-card border border-border bg-white shadow-soft text-lg text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition"
        />
        {loading ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
        ) : q ? (
          <button
            type="button"
            onClick={() => { setQ(""); setResults({ rabbis: [], lessons: [], topics: [] }); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            aria-label="נקה"
          >
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full mt-2 w-full bg-white rounded-card border border-border shadow-card overflow-hidden max-h-[70vh] overflow-y-auto z-50"
        >
          {totalResults === 0 && !loading ? (
            <div className="p-6 text-center text-sm text-ink-muted">
              לא נמצאו תוצאות עבור &quot;{q}&quot;.{" "}
              <Link href={`/lessons?q=${encodeURIComponent(q.trim())}`} className="text-primary hover:underline" onClick={() => setOpen(false)}>
                חפש בכל השיעורים →
              </Link>
            </div>
          ) : (
            <>
              {results.rabbis.length > 0 && (
                <Section title="רבנים" icon={User}>
                  {results.rabbis.map((r, i) => {
                    const idx = i;
                    return (
                      <ResultRow key={r.slug} href={r.href} active={activeIdx === idx} onClick={() => setOpen(false)}>
                        {r.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-border" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gold-soft flex items-center justify-center text-gold font-bold text-sm">
                            {r.name.replace("הרב ", "").charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink truncate">{r.name}</div>
                          <div className="text-xs text-ink-muted">{r.lessonCount} שיעורים</div>
                        </div>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}

              {results.lessons.length > 0 && (
                <Section title="שיעורים" icon={BookOpen}>
                  {results.lessons.map((l, i) => {
                    const idx = results.rabbis.length + i;
                    return (
                      <ResultRow key={l.id} href={l.href} active={activeIdx === idx} onClick={() => setOpen(false)}>
                        <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink truncate">{l.title}</div>
                          <div className="text-xs text-ink-muted truncate">
                            {l.rabbiName} · {new Date(l.scheduledAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}

              {results.topics.length > 0 && (
                <Section title="נושאים" icon={Tag}>
                  {results.topics.map((t, i) => {
                    const idx = results.rabbis.length + results.lessons.length + i;
                    return (
                      <ResultRow key={t.name} href={t.href} active={activeIdx === idx} onClick={() => setOpen(false)}>
                        <div className="w-9 h-9 rounded bg-gold-soft flex items-center justify-center text-gold">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink">{t.name}</div>
                          <div className="text-xs text-ink-muted">{t.lessonCount} שיעורים</div>
                        </div>
                      </ResultRow>
                    );
                  })}
                </Section>
              )}

              {/* Footer — show all */}
              <Link
                href={`/lessons?q=${encodeURIComponent(q.trim())}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 bg-paper-soft text-center text-sm text-primary font-medium hover:bg-primary-soft transition border-t border-border"
              >
                ראה את כל התוצאות עבור &quot;{q.trim()}&quot; →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-2 text-[11px] font-bold text-ink-muted uppercase tracking-wider bg-paper-soft border-b border-border flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ href, active, children, onClick }: { href: string; active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="option"
      aria-selected={active}
      className={`flex items-center gap-3 px-4 py-2.5 transition ${active ? "bg-primary-soft" : "hover:bg-paper-soft"}`}
    >
      {children}
    </Link>
  );
}
