import { describe, it, expect } from "vitest";

// בדיקות לוגיקה גרידא של ה-label של ExpirationCountdown.
// הקומפוננטה היא "use client" עם useEffect/setInterval, ולכן הלוגיקה
// משוכפלת כאן בפונקציה בודקת כדי לא לדרוש react-testing-library.

function computeLabel(diff: number): { label: string; expired: boolean; urgent: boolean } {
  const expired = diff <= 0;
  if (expired) return { label: "פג תוקף", expired: true, urgent: false };

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (days >= 1) {
    return {
      label: `${days} ${days === 1 ? "יום" : "ימים"}${hours ? ` ${hours} שע׳` : ""}`,
      expired: false, urgent: false,
    };
  }
  if (hours >= 1) {
    return {
      label: `${hours} שע׳${minutes ? ` ${minutes} דק׳` : ""}`,
      expired: false, urgent: false,
    };
  }
  return {
    label: `${Math.max(1, minutes)} דק׳`,
    expired: false, urgent: true,
  };
}

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

describe("ExpirationCountdown label logic", () => {
  it("expired (diff <= 0) → 'פג תוקף'", () => {
    expect(computeLabel(-1).label).toBe("פג תוקף");
    expect(computeLabel(0).label).toBe("פג תוקף");
    expect(computeLabel(-1000).expired).toBe(true);
  });

  it("5 days → '5 ימים'", () => {
    const r = computeLabel(5 * day);
    expect(r.label).toBe("5 ימים");
    expect(r.urgent).toBe(false);
  });

  it("4 days 12 hours → '4 ימים 12 שע׳'", () => {
    const r = computeLabel(4 * day + 12 * hour);
    expect(r.label).toBe("4 ימים 12 שע׳");
  });

  it("exactly 1 day → '1 יום' (singular)", () => {
    expect(computeLabel(day).label).toBe("1 יום");
  });

  it("2 days exact → '2 ימים' (plural)", () => {
    expect(computeLabel(2 * day).label).toBe("2 ימים");
  });

  it("5 hours 20 minutes → '5 שע׳ 20 דק׳'", () => {
    const r = computeLabel(5 * hour + 20 * minute);
    expect(r.label).toBe("5 שע׳ 20 דק׳");
    expect(r.urgent).toBe(false);
  });

  it("3 hours exact → '3 שע׳' (no minutes part)", () => {
    expect(computeLabel(3 * hour).label).toBe("3 שע׳");
  });

  it("45 minutes → urgent + '45 דק׳'", () => {
    const r = computeLabel(45 * minute);
    expect(r.label).toBe("45 דק׳");
    expect(r.urgent).toBe(true);
  });

  it("under 1 minute → still shows '1 דק׳' (never 0)", () => {
    const r = computeLabel(30_000); // 30 sec
    expect(r.label).toBe("1 דק׳");
    expect(r.urgent).toBe(true);
  });

  it("just over the urgent boundary (1h+1m) → not urgent", () => {
    const r = computeLabel(hour + 1 * minute);
    expect(r.urgent).toBe(false);
  });
});
