import { chromium, devices } from "@playwright/test";
import * as fs from "fs/promises";

async function shot(viewport: { width: number; height: number; isMobile?: boolean; ua?: string }, name: string) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, isMobile: viewport.isMobile, userAgent: viewport.ua });
  const page = await ctx.newPage();
  console.log(`📸 [${name}] navigating...`);
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  const path = `screenshots/home-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`✅ ${path}`);
  // also capture lessons page
  await page.goto("http://localhost:3000/lessons", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `screenshots/lessons-${name}.png`, fullPage: true });
  await page.goto("http://localhost:3000/rabbi/eliezer-melamed", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `screenshots/rabbi-${name}.png`, fullPage: true });
  await browser.close();
}

(async () => {
  await shot({ width: 1440, height: 900 }, "desktop");
  await shot({ width: 390, height: 844, isMobile: true, ua: devices["iPhone 13"].userAgent }, "mobile");
  console.log("done");
})();
