import { chromium, devices } from "@playwright/test";

(async () => {
  const b = await chromium.launch();
  const targets: { name: string; vp: any; mobile: boolean; url: string }[] = [
    { name: "home-d3", vp: { width: 1440, height: 900 }, mobile: false, url: "http://localhost:3000/" },
    { name: "home-m3", vp: devices["iPhone 13"].viewport, mobile: true, url: "http://localhost:3000/" },
    { name: "lessons-d3", vp: { width: 1440, height: 900 }, mobile: false, url: "http://localhost:3000/lessons" },
    { name: "lessons-m3", vp: devices["iPhone 13"].viewport, mobile: true, url: "http://localhost:3000/lessons" },
    { name: "rabbi-d3", vp: { width: 1440, height: 900 }, mobile: false, url: "http://localhost:3000/rabbi/eliezer-melamed" },
    { name: "rabbi-m3", vp: devices["iPhone 13"].viewport, mobile: true, url: "http://localhost:3000/rabbi/eliezer-melamed" },
  ];
  for (const t of targets) {
    const ctx = await b.newContext({ viewport: t.vp, isMobile: t.mobile, userAgent: t.mobile ? devices["iPhone 13"].userAgent : undefined });
    const page = await ctx.newPage();
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/${t.name}.png`, fullPage: true });
    await ctx.close();
    console.log(`✅ ${t.name}.png`);
  }
  await b.close();
})();
