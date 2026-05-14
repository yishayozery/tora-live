/**
 * לוגיקה טהורה (pure) לקביעת מצב התצוגה של ה-Hero בעמוד שיעור.
 * מובדל מהקומפוננטה כדי שיהיה ניתן ליחידת-בדיקה ב-Node ללא DOM.
 */

export type HeroState =
  | "LIVE"           // משדר עכשיו (יש playbackUrl או liveEmbedUrl)
  | "UPCOMING"       // עתידי — לא משדר עדיין
  | "ENDED_REC"      // הסתיים אבל יש הקלטה זמינה
  | "EXTERNAL"       // קישור חיצוני (Zoom וכו׳) ועדיין לא לייב/הסתיים
  | "ENDED";         // הסתיים, אין מה להציג

export interface HeroInput {
  isLive: boolean;
  scheduledAt: Date | string;
  durationMin?: number | null;
  playbackUrl?: string | null;
  liveEmbedUrl?: string | null;
  recordingExpiry?: Date | string | null;
  youtubeUrl?: string | null;
  otherUrl?: string | null;
  /** ה"עכשיו" לצורך טסטים. ברירת מחדל: Date.now(). */
  now?: Date;
}

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

export function determineHeroState(input: HeroInput): HeroState {
  const now = input.now ?? new Date();
  const start = toDate(input.scheduledAt);
  const end = input.durationMin
    ? new Date(start.getTime() + input.durationMin * 60_000)
    : null;

  if (input.isLive && (input.playbackUrl || input.liveEmbedUrl)) return "LIVE";

  // הסתיים?
  const hasEnded = end ? now.getTime() > end.getTime() : now.getTime() > start.getTime() + 4 * 3_600_000;
  if (hasEnded) {
    const recExpiry = input.recordingExpiry ? toDate(input.recordingExpiry) : null;
    const recValid = input.playbackUrl && recExpiry && recExpiry.getTime() > now.getTime();
    if (recValid) return "ENDED_REC";
    // יוטיוב נשמר תמיד — אם יש URL והשיעור הסתיים, נציג כהקלטה
    if (input.youtubeUrl) return "ENDED_REC";
    return "ENDED";
  }

  // עתידי / לא לייב כרגע אבל בטווח — אם יש קישור חיצוני, מצב EXTERNAL
  if (input.liveEmbedUrl || input.youtubeUrl || input.otherUrl) return "EXTERNAL";

  return "UPCOMING";
}

export interface Countdown {
  totalMs: number;
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  /** טקסט עברי קצר, למשל "יתחיל בעוד 3 שע׳ 20 דק׳". */
  label: string;
}

/**
 * מחשב countdown עברי ל-scheduledAt.
 * שימוש: גם ב-server (SSR fallback) וגם ב-client (תוך useEffect/setInterval).
 */
export function computeCountdown(targetMs: number, nowMs: number): Countdown {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { totalMs: diff, expired: true, days: 0, hours: 0, minutes: 0, label: "מתחיל עכשיו" };
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  let label: string;
  if (days >= 1) {
    label = `יתחיל בעוד ${days} ${days === 1 ? "יום" : "ימים"}${hours ? ` ${hours} שע׳` : ""}`;
  } else if (hours >= 1) {
    label = `יתחיל בעוד ${hours} שע׳${minutes ? ` ${minutes} דק׳` : ""}`;
  } else {
    label = `יתחיל בעוד ${Math.max(1, minutes)} דק׳`;
  }
  return { totalMs: diff, expired: false, days, hours, minutes, label };
}

/**
 * בוחר את הקישור החיצוני המתאים להזנקה ללייב, לפי עדיפות.
 */
export function pickExternalLiveUrl(input: {
  liveEmbedUrl?: string | null;
  youtubeUrl?: string | null;
  otherUrl?: string | null;
}): string | null {
  return input.liveEmbedUrl || input.youtubeUrl || input.otherUrl || null;
}
