"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Youtube, Music, Globe, Facebook, Link as LinkIcon, Radio, Video, MessageSquareReply } from "lucide-react";

type LiveMode = "OWN" | "PLATFORM";

type Initial = {
  bio: string;
  slug: string;
  liveMode: LiveMode;
  media: {
    youtube: string;
    spotify: string;
    applePodcast: string;
    soundcloud: string;
    facebook: string;
    website: string;
    other: string;
  };
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
};

const MEDIA_FIELDS: { key: keyof Initial["media"]; label: string; icon: any; placeholder: string }[] = [
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@your-channel" },
  { key: "spotify", label: "Spotify", icon: Music, placeholder: "https://open.spotify.com/show/..." },
  { key: "applePodcast", label: "Apple Podcasts", icon: Music, placeholder: "https://podcasts.apple.com/..." },
  { key: "soundcloud", label: "SoundCloud", icon: Music, placeholder: "https://soundcloud.com/..." },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/..." },
  { key: "website", label: "אתר אישי", icon: Globe, placeholder: "https://..." },
  { key: "other", label: "קישור נוסף", icon: LinkIcon, placeholder: "https://..." },
];

export function RabbiProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [bio, setBio] = useState(initial.bio);
  const [slug, setSlug] = useState(initial.slug);
  const [liveMode, setLiveMode] = useState<LiveMode>(initial.liveMode);
  const [media, setMedia] = useState(initial.media);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(initial.autoReplyEnabled);
  const [autoReplyMessage, setAutoReplyMessage] = useState(initial.autoReplyMessage);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    const res = await fetch("/api/me/rabbi-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        slug,
        liveMode,
        media,
        autoReplyEnabled,
        autoReplyMessage: autoReplyEnabled ? autoReplyMessage : "",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "שגיאה בשמירה");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* פרטי דף */}
      <Card>
        <h2 className="hebrew-serif text-xl font-bold mb-4">דף הרב</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-medium">תיאור / אודות</label>
            <textarea
              required minLength={20} rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-border bg-white min-h-[6rem]"
              placeholder="ספר על עצמך — ישיבה, תחומי התמחות, סגנון הלימוד..."
            />
            <div className="flex justify-between text-xs text-ink-muted mt-1">
              <span>{bio.length >= 20 ? "✓ מספיק" : `לפחות 20 תווים (עכשיו: ${bio.length})`}</span>
              <span>{bio.length}/2000</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-medium">כתובת דף הרב</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted shrink-0" dir="ltr">/rabbi/</span>
              <input
                required pattern="[a-z0-9-]+"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="flex-1 h-11 px-3 rounded-btn border border-border bg-white" dir="ltr"
              />
            </div>
            <p className="text-xs text-ink-muted mt-1">באנגלית, אותיות קטנות ומקפים בלבד</p>
          </div>
        </div>
      </Card>

      {/* מדיות */}
      <Card>
        <h2 className="hebrew-serif text-xl font-bold mb-2">קישורים למדיה</h2>
        <p className="text-sm text-ink-muted mb-4">
          יופיעו בדף הרב כפתורי מעבר לערוצים שלך. ניתן להשאיר ריק מה שלא רלוונטי.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEDIA_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-sm text-ink-soft mb-1 font-medium">
                <Icon className="w-4 h-4" />
                {label}
              </label>
              <input
                type="url"
                value={media[key]}
                onChange={(e) => setMedia({ ...media, [key]: e.target.value })}
                className="w-full h-10 px-3 rounded-btn border border-border bg-white text-sm" dir="ltr"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* מסלול שידור חי */}
      <Card>
        <h2 className="hebrew-serif text-xl font-bold mb-2 flex items-center gap-2">
          <Radio className="w-5 h-5 text-live" /> שידור חי
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          כשתתחיל שידור חי, איך להציג אותו באתר?
        </p>
        <div className="space-y-3">
          <ModeOption
            value="OWN"
            selected={liveMode === "OWN"}
            onClick={() => setLiveMode("OWN")}
            icon={Youtube}
            title="מהערוץ שלי"
            desc="אני משדר ב-YouTube / Zoom / כל פלטפורמה שיש לי, ומדביק כאן את הלינק. האתר יציג embed + צ׳אט שאלות בצד. מהיר, אפס הגדרות."
            badge="מומלץ"
          />
          <ModeOption
            value="PLATFORM"
            selected={liveMode === "PLATFORM"}
            onClick={() => setLiveMode("PLATFORM")}
            icon={Video}
            title="דרך הערוץ של TORA_LIVE"
            desc="גם אם אין לך ערוץ יוטיוב — נפיק לך stream key. תוכל לשדר דרך OBS / StreamYard / טלפון ישירות לערוץ המרכזי שלנו. דורש הגדרה ראשונית חד-פעמית."
            badge="בקרוב"
            disabled
          />
        </div>
      </Card>

      {/* מענה אוטומטי לבקשות */}
      <Card>
        <h2 className="hebrew-serif text-xl font-bold mb-2 flex items-center gap-2">
          <MessageSquareReply className="w-5 h-5 text-primary" /> מענה אוטומטי לבקשות
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          כל פנייה חדשה תענה אוטומטית בהודעה הזו ותסומן כ״נענתה״. שימושי כשאין פנאי להגיב ידנית.
        </p>
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={autoReplyEnabled}
            onChange={(e) => setAutoReplyEnabled(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <span className="font-medium text-ink">הפעל מענה אוטומטי</span>
        </label>
        <div>
          <label className="block text-sm text-ink-soft mb-1 font-medium">
            תוכן המענה האוטומטי
          </label>
          <textarea
            rows={4}
            value={autoReplyMessage}
            onChange={(e) => setAutoReplyMessage(e.target.value)}
            disabled={!autoReplyEnabled}
            placeholder="לדוגמה: שלום, תודה על פנייתך. אשתדל לחזור אליך בהקדם. בינתיים ניתן לעקוב אחרי השיעורים בדף שלי."
            className="w-full px-3 py-2 rounded-btn border border-border bg-white min-h-[6rem] disabled:bg-paper-soft disabled:text-ink-muted"
          />
          {autoReplyEnabled && autoReplyMessage.trim().length === 0 && (
            <p className="text-xs text-danger mt-1">
              הוסף תוכן למענה האוטומטי כדי שהוא ישלח
            </p>
          )}
        </div>
      </Card>

      {err && <div className="text-sm text-danger">{err}</div>}
      {ok && <div className="text-sm text-live">✓ הפרופיל נשמר</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? "שומר..." : "שמור שינויים"}
        </Button>
      </div>
    </form>
  );
}

function ModeOption({
  value, selected, onClick, icon: Icon, title, desc, badge, disabled,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
  icon: any;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full text-right p-4 rounded-card border transition ${
        disabled
          ? "opacity-60 cursor-not-allowed border-border bg-paper-soft"
          : selected
          ? "border-primary bg-primary-soft/40 shadow-soft"
          : "border-border bg-white hover:border-primary/40"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selected ? "bg-primary text-white" : "bg-primary-soft text-primary"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold text-ink">{title}</div>
            {badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                badge === "מומלץ" ? "bg-live/10 text-live" : "bg-gold-soft text-gold"
              }`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </button>
  );
}
