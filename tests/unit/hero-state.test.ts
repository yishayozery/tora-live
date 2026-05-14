import { describe, it, expect } from "vitest";
import { determineHeroState, computeCountdown, pickExternalLiveUrl } from "@/lib/lesson/hero-state";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("determineHeroState", () => {
  const now = new Date("2026-05-14T12:00:00Z");

  it("LIVE when isLive + playbackUrl", () => {
    expect(determineHeroState({
      isLive: true, scheduledAt: now, playbackUrl: "https://x/play", now,
    })).toBe("LIVE");
  });

  it("LIVE when isLive + liveEmbedUrl (no playback)", () => {
    expect(determineHeroState({
      isLive: true, scheduledAt: now, liveEmbedUrl: "https://yt/live", now,
    })).toBe("LIVE");
  });

  it("UPCOMING when in future, no external link", () => {
    const future = new Date(now.getTime() + 3 * HOUR);
    expect(determineHeroState({
      isLive: false, scheduledAt: future, now,
    })).toBe("UPCOMING");
  });

  it("EXTERNAL when future + has youtube URL", () => {
    const future = new Date(now.getTime() + 3 * HOUR);
    expect(determineHeroState({
      isLive: false, scheduledAt: future, youtubeUrl: "https://yt/x", now,
    })).toBe("EXTERNAL");
  });

  it("EXTERNAL when future + liveEmbedUrl set but isLive false", () => {
    const future = new Date(now.getTime() + 30 * MIN);
    expect(determineHeroState({
      isLive: false, scheduledAt: future, liveEmbedUrl: "https://zoom/abc", now,
    })).toBe("EXTERNAL");
  });

  it("ENDED_REC when past + playbackUrl + valid recordingExpiry", () => {
    const past = new Date(now.getTime() - 3 * HOUR);
    expect(determineHeroState({
      isLive: false, scheduledAt: past, durationMin: 60,
      playbackUrl: "https://x/play",
      recordingExpiry: new Date(now.getTime() + 5 * DAY),
      now,
    })).toBe("ENDED_REC");
  });

  it("ENDED_REC when past + youtubeUrl (no playback/expiry)", () => {
    const past = new Date(now.getTime() - 6 * HOUR);
    expect(determineHeroState({
      isLive: false, scheduledAt: past, durationMin: 60,
      youtubeUrl: "https://yt/x",
      now,
    })).toBe("ENDED_REC");
  });

  it("ENDED when past + expired recording + no youtube", () => {
    const past = new Date(now.getTime() - 10 * DAY);
    expect(determineHeroState({
      isLive: false, scheduledAt: past, durationMin: 60,
      playbackUrl: "https://x/play",
      recordingExpiry: new Date(now.getTime() - DAY), // already expired
      now,
    })).toBe("ENDED");
  });
});

describe("computeCountdown", () => {
  const now = 1_700_000_000_000;

  it("expired → 'מתחיל עכשיו'", () => {
    const r = computeCountdown(now - 1, now);
    expect(r.expired).toBe(true);
    expect(r.label).toBe("מתחיל עכשיו");
  });

  it("3 hours 20 minutes → friendly hebrew", () => {
    const r = computeCountdown(now + 3 * HOUR + 20 * MIN, now);
    expect(r.label).toBe("יתחיל בעוד 3 שע׳ 20 דק׳");
    expect(r.hours).toBe(3);
    expect(r.minutes).toBe(20);
  });

  it("1 day → singular 'יום'", () => {
    const r = computeCountdown(now + DAY, now);
    expect(r.label).toBe("יתחיל בעוד 1 יום");
  });

  it("2 days 5 hours → plural + hours", () => {
    const r = computeCountdown(now + 2 * DAY + 5 * HOUR, now);
    expect(r.label).toBe("יתחיל בעוד 2 ימים 5 שע׳");
  });

  it("under a minute → '1 דק׳' (never 0)", () => {
    const r = computeCountdown(now + 30_000, now);
    expect(r.label).toBe("יתחיל בעוד 1 דק׳");
  });
});

describe("pickExternalLiveUrl", () => {
  it("prefers liveEmbedUrl", () => {
    expect(pickExternalLiveUrl({
      liveEmbedUrl: "a", youtubeUrl: "b", otherUrl: "c",
    })).toBe("a");
  });

  it("falls back to youtubeUrl", () => {
    expect(pickExternalLiveUrl({ youtubeUrl: "b", otherUrl: "c" })).toBe("b");
  });

  it("falls back to otherUrl", () => {
    expect(pickExternalLiveUrl({ otherUrl: "c" })).toBe("c");
  });

  it("returns null when no URLs", () => {
    expect(pickExternalLiveUrl({})).toBeNull();
  });
});
