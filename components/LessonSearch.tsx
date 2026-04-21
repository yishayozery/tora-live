"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, User, Tag, Calendar, Clock, Filter, Languages, Radio } from "lucide-react";

export type FilterOption = { value: string; label: string; count?: number };
export type SearchOptions = {
  rabbis: FilterOption[];
  topics: FilterOption[];
  languages?: FilterOption[];
  broadcastTypes?: FilterOption[];
  /** פילוחים נוספים שהרבנים הגדירו בעצמם (תגיות) */
  tags?: FilterOption[];
};

const DATE_OPTIONS: FilterOption[] = [
  { value: "today", label: "היום" },
  { value: "tomorrow", label: "מחר" },
  { value: "week", label: "השבוע" },
  { value: "month", label: "החודש" },
];

const TIME_OPTIONS: FilterOption[] = [
  { value: "morning", label: "בוקר (06-12)" },
  { value: "noon", label: "צהריים (12-16)" },
  { value: "evening", label: "אחה״צ/ערב (16-20)" },
  { value: "night", label: "לילה (20-00)" },
];

export function LessonSearch({ options }: { options: SearchOptions }) {
  const router = useRouter();
  const [rabbi, setRabbi] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tag, setTag] = useState("");
  const [language, setLanguage] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasTags = (options.tags?.length ?? 0) > 0;
  const hasLanguages = (options.languages?.length ?? 0) > 0;
  const hasTypes = (options.broadcastTypes?.length ?? 0) > 0;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (rabbi) params.set("rabbi", rabbi);
    if (topic) params.set("topic", topic);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (tag) params.set("tag", tag);
    if (language) params.set("lang", language);
    if (type) params.set("type", type);
    return params.toString();
  }, [q, rabbi, topic, date, time, tag, language, type]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/lessons${queryString ? `?${queryString}` : ""}`);
  }

  // === Live filtering ===
  // אם המשתמש כבר ב-/lessons → סינון מיידי (debounce 300ms על שדה החיפוש)
  // אם המשתמש בדף הבית → ניווט ישיר ל-/lessons בכל שינוי dropdown (לא debounce — רק על q)
  const pathname = usePathname();
  const onLessonsPage = pathname === "/lessons";
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // טריגר על כל שינוי בפילטרים (לא על q — שם debounce בנפרד)
    const url = `/lessons${queryString ? `?${queryString}` : ""}`;
    if (onLessonsPage) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rabbi, topic, date, time, tag, language, type]);

  // Debounced q — רק על דף /lessons (כדי לא להעיף את המשתמש מהבית עם כל מקש)
  useEffect(() => {
    if (!onLessonsPage) return;
    if (isFirstRender.current) return;
    const handle = setTimeout(() => {
      router.replace(`/lessons${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <form onSubmit={submit} className="w-full">
      {/* שדה חיפוש ראשי */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפש שיעור, רב, מסכת או נושא…"
          className="w-full h-14 pr-12 pl-36 rounded-card border border-border bg-white shadow-soft text-lg text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition"
        />
        <button
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
        >
          חפש
        </button>
      </div>

      {/* פילטרים — היררכיה: primary (ראשי) + secondary (משני, מוסתר במובייל) */}
      <div className="mt-4 space-y-2">
        {/* Primary: שם הרב + נושא + תאריך — תמיד מוצגים */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft px-2">
            <Filter className="w-3.5 h-3.5" /> סינון:
          </span>
          <FilterSelect icon={User} label="שם הרב" value={rabbi} onChange={setRabbi} options={options.rabbis} primary />
          <FilterSelect icon={Tag} label="נושא" value={topic} onChange={setTopic} options={options.topics} primary />
          <FilterSelect icon={Calendar} label="תאריך" value={date} onChange={setDate} options={DATE_OPTIONS} primary />
          {/* Toggle עוד פילטרים — מובייל */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="sm:hidden h-11 px-4 rounded-full border border-border bg-paper-soft text-ink-soft text-sm font-medium hover:bg-white transition active:scale-95"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "פחות פילטרים" : "עוד פילטרים +"}
          </button>
        </div>

        {/* Secondary: שעה / סוג / שפה / תגיות */}
        <div className={`flex flex-wrap items-center gap-2 ${showAdvanced ? "" : "hidden sm:flex"}`}>
          <FilterSelect icon={Clock} label="שעה" value={time} onChange={setTime} options={TIME_OPTIONS} />
          {hasTypes && <FilterSelect icon={Radio} label="סוג" value={type} onChange={setType} options={options.broadcastTypes!} />}
          {hasLanguages && <FilterSelect icon={Languages} label="שפה" value={language} onChange={setLanguage} options={options.languages!} />}
          {hasTags && <FilterSelect icon={Tag} label="תגיות" value={tag} onChange={setTag} options={options.tags!} />}

          {(rabbi || topic || date || time || tag || language || type || q) && (
            <button
              type="button"
              onClick={() => {
                setRabbi(""); setTopic(""); setDate(""); setTime(""); setTag(""); setLanguage(""); setType(""); setQ("");
              }}
              className="h-11 sm:h-9 px-3 text-sm text-primary hover:underline font-medium"
            >
              נקה סינון
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  primary = false,
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  primary?: boolean;
}) {
  const active = !!value;
  return (
    <label
      className={`relative inline-flex items-center gap-2 min-h-[44px] sm:min-h-[36px] pr-3 pl-2 rounded-full border cursor-pointer text-sm transition active:scale-95 ${
        active
          ? "bg-primary text-white border-primary shadow-soft"
          : primary
            ? "bg-white text-ink border-primary/30 hover:border-primary"
            : "bg-paper-soft text-ink-soft border-border hover:bg-white hover:border-primary"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="select-none whitespace-nowrap">
        {label}
        {active && (
          <span className="mr-1 font-semibold">
            · {options.find((o) => o.value === value)?.label}
          </span>
        )}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      >
        <option value="">כל {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.count != null ? ` (${o.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
