import { chromium, devices } from "@playwright/test";
(async () => {
  const b = await chromium.launch();
  const targets: any[] = [
    { name: "home-d4", vp: { width: 1440, height: 900 }, mobile: false, url: "http://localhost:3000/" },
    { name: "home-m4", vp: devices["iPhone 13"].viewport, mobile: true, url: "http://localhost:3000/" },
    { name: "rabbi-cohen-d4", vp: { width: 1440, height: 900 }, mobile: false, url: "http://localhost:3000/rabbi/aharon-cohen" },
    { name: "rabbi-cohen-m4", vp: devices["iPhone 13"].viewport, mobile: true, url: "http://localhost:3000/rabbi/aharon-cohen" },
  ];
  for (const t of targets) {
    const ctx = await b.newContext({ viewport: t.vp, isMobile: t.mobile, userAgent: t.mobile ? devices["iPhone 13"].userAgent : undefined });
    const page = await ctx.newPage();
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/${t.name}.png`, fullPage: true });
    console.log(`✅ ${t.name}`);
    await ctx.close();
  }
  await b.close();
})();
