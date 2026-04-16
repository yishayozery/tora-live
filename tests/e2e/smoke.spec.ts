import { test, expect } from "@playwright/test";
import path from "path";

test.describe("smoke", () => {
  test("home page renders hero, sponsor, header, filters", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("מצא את השיעור");
    await expect(page.getByText("שלום קורח")).toBeVisible();
    await expect(page.getByRole("link", { name: /הרשמת רב/ }).first()).toBeVisible();
    // 7 filters: rabbi, topic, date, time, type, language, tags
    const selects = page.locator("form select");
    await expect(selects).toHaveCount(7);
  });

  test("login page has email, password, submit", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /התחבר/ })).toBeVisible();
  });

  test("register page has student header", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText(/הרשמה כתלמיד/)).toBeVisible();
  });

  test("rabbi register page has minimal fields (name/email/password/phone)", async ({ page }) => {
    await page.goto("/rabbi/register");
    await expect(page.getByText(/הרשמת רב/).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    // וידוא שאין יותר bio/slug בטופס ההרשמה
    await expect(page.locator("textarea")).toHaveCount(0);
  });

  test("/my/schedule redirects to /login when unauthenticated", async ({ page }) => {
    const res = await page.goto("/my/schedule");
    expect(page.url()).toContain("/login");
    expect(res?.status()).toBeLessThan(500);
  });

  test("/dashboard redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    expect(page.url()).toContain("/login");
  });

  for (const pathname of ["/rabbis", "/lessons", "/donate"]) {
    test(`optional page ${pathname}`, async ({ page }) => {
      const res = await page.goto(pathname, { waitUntil: "domcontentloaded" });
      const status = res?.status() ?? 0;
      if (status === 404) {
        test.skip(true, `${pathname} not implemented`);
      }
      expect(status).toBeLessThan(500);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("home search redirects to /lessons with q", async ({ page }) => {
    await page.goto("/");
    const input = page.locator('form input[type="text"], form input[type="search"]').first();
    await input.fill("דף יומי");
    await page.getByRole("button", { name: /חפש/ }).first().click();
    await page.waitForURL(/\/lessons/);
    expect(page.url()).toMatch(/\/lessons/);
    expect(decodeURIComponent(page.url()).replace(/\+/g, " ")).toContain("דף יומי");
  });

  test("mobile screenshot of home page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: path.join("tests", "e2e", "__screenshots__", "home-mobile.png"),
      fullPage: true,
    });
  });
});
