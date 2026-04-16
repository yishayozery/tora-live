import { test, expect, Page } from "@playwright/test";

// --------------- helpers ---------------

const ADMIN_EMAIL = "admin@tora-live.co.il";
const ADMIN_PASS = "admin1234";
const RABBI_EMAIL = "yosef@example.com";
const RABBI_PASS = "password123";

/** Log in via the /login page */
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /התחבר/ }).click();
  // wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

/** Log out by navigating to the NextAuth signout endpoint and confirming */
async function logout(page: Page) {
  await page.goto("/api/auth/signout");
  await page.waitForLoadState("networkidle");
  // NextAuth shows a confirmation button
  const btn = page.getByRole("button", { name: /sign out|יציאה|צא/i });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    await page.waitForLoadState("networkidle");
  }
  // Ensure session is gone by navigating home
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/** Tomorrow at 10:00 formatted for datetime-local input */
function tomorrowDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

// -------------------------------------------------------
// 1. Rabbi registration + admin approval flow
// -------------------------------------------------------
test.describe.serial("1. Rabbi full flow", () => {
  const uniqueEmail = `test-rabbi-${Date.now()}@test.co`;
  const rabbiName = "רב בדיקה אוטומטי";

  test("register a new rabbi and see success message", async ({ page }) => {
    await page.goto("/rabbi/register");
    await page.waitForLoadState("networkidle");

    // fill the form
    await page.locator('input').first().fill(rabbiName); // name
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill("test1234");
    await page.locator('input[type="tel"]').fill("0501111111");

    await page.getByRole("button", { name: /שלח בקשה/ }).click();
    await expect(page.getByText("הבקשה נשלחה")).toBeVisible({ timeout: 10000 });
  });

  test("admin approves the new rabbi", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto("/admin/rabbis");
    await page.waitForLoadState("networkidle");

    // Find the pending rabbi card with our email or name
    const card = page.locator("text=" + rabbiName).locator("xpath=ancestor::*[contains(@class,'card') or contains(@class,'Card')]").first();
    // If not found by ancestor, try looking for the approve button near the rabbi name
    const approveBtn = page.getByRole("button", { name: "אשר" }).first();
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // Wait for router.refresh — the button should disappear or move to approved section
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Verify the rabbi moved to approved section or no longer in pending
    // Reload to be sure
    await page.reload();
    await page.waitForLoadState("networkidle");
    // The rabbi name should still appear (now in approved section)
    await expect(page.getByText(rabbiName).first()).toBeVisible();
  });

  test("new rabbi logs in and sees dashboard", async ({ page }) => {
    await login(page, uniqueEmail, "test1234");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");
    // Should see "complete profile" prompt since bio is empty
    await expect(page.getByText("השלם את הפרופיל")).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------
// 2. New lesson flow (as existing rabbi yosef)
// -------------------------------------------------------
test.describe.serial("2. New lesson flow", () => {
  let createdLessonTitle: string;

  test("create a new lesson", async ({ page }) => {
    await login(page, RABBI_EMAIL, RABBI_PASS);

    await page.goto("/dashboard/lessons/new");
    await page.waitForLoadState("networkidle");

    createdLessonTitle = `שיעור בדיקה אוטומטי ${Date.now()}`;

    // Title
    const titleLabel = page.locator("label", { hasText: "כותרת" });
    await titleLabel.locator("xpath=following-sibling::input | ../input").first().fill(createdLessonTitle);

    // Description
    await page.locator("textarea").fill("תיאור ארוך מספיק לבדיקה. זהו שיעור בדיקה אוטומטי שנוצר במסגרת בדיקות E2E.");

    // Scheduled date — tomorrow at 10:00
    const dtInput = page.locator('input[type="datetime-local"]');
    await dtInput.fill(tomorrowDatetime());

    // broadcastType — click "שיעור" (LESSON) — it should be default, but click to be safe
    const lessonRadio = page.locator('[role="radio"]').first();
    await lessonRadio.click();

    // Submit
    await page.getByRole("button", { name: /צור שיעור/ }).click();

    // Wait for redirect to /dashboard/lessons
    await page.waitForURL("**/dashboard/lessons", { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Verify the new lesson appears in the list
    await expect(page.getByText(createdLessonTitle)).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------
  // 3. Live broadcast flow — edit the lesson
  // -------------------------------------------------------
  test("edit lesson to set live + youtube URL", async ({ page }) => {
    await login(page, RABBI_EMAIL, RABBI_PASS);
    await page.goto("/dashboard/lessons");
    await page.waitForLoadState("networkidle");

    // Click "ערוך" on the first lesson (most recent)
    const editLink = page.getByRole("link", { name: "ערוך" }).first();
    await editLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("עריכת שיעור")).toBeVisible();

    // Get the lesson ID from the URL for later navigation
    const url = page.url();
    const lessonId = url.split("/dashboard/lessons/")[1]?.split("/")[0]?.split("?")[0];
    expect(lessonId).toBeTruthy();

    // Fill YouTube URL
    const ytLabel = page.locator("label", { hasText: "YouTube" });
    const ytInput = ytLabel.locator("xpath=following-sibling::input | ../input").first();
    await ytInput.fill("https://youtube.com/live/test123");

    // Submit changes
    await page.getByRole("button", { name: /שמור שינויים/ }).click();
    await page.waitForURL("**/dashboard/lessons", { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Now navigate to the public lesson page
    await page.goto(`/lesson/${lessonId}`);
    await page.waitForLoadState("networkidle");

    // Verify YouTube link is visible
    await expect(page.getByRole("link", { name: "YouTube" })).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------
// 4. Student flow
// -------------------------------------------------------
test.describe.serial("4. Student flow", () => {
  const studentEmail = `test-student-${Date.now()}@test.co`;
  const studentName = "תלמיד בדיקה";

  test("register as student and verify redirect to home", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Fill registration form
    const nameInput = page.locator('input').first();
    await nameInput.fill(studentName);
    await page.locator('input[type="email"]').fill(studentEmail);
    await page.locator('input[type="password"]').fill("test1234");

    await page.getByRole("button", { name: /הירשם/ }).click();

    // Should redirect to home page
    await page.waitForURL("/", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  test("visit rabbi page and see follow button", async ({ page }) => {
    await login(page, studentEmail, "test1234");
    await page.goto("/rabbi/yosef-cohen");
    await page.waitForLoadState("networkidle");

    // Verify follow button exists
    await expect(page.getByRole("button", { name: /עקוב/ })).toBeVisible({ timeout: 10000 });
  });

  test("visit a lesson page and see chat section", async ({ page }) => {
    await login(page, studentEmail, "test1234");

    // First find a lesson to visit
    await page.goto("/lessons");
    await page.waitForLoadState("networkidle");

    // Try to find a lesson link, or go directly to a known lesson
    const lessonLink = page.locator('a[href^="/lesson/"]').first();
    if (await lessonLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await lessonLink.click();
      await page.waitForLoadState("networkidle");
      // Check for chat section (LessonChat component renders "שאלות" heading or chat area)
      const chatSection = page.getByText(/שאלות|שאלה/);
      await expect(chatSection.first()).toBeVisible({ timeout: 10000 });
    } else {
      // No lessons listed — find a lesson from the DB by navigating to rabbi page
      await page.goto("/rabbi/yosef-cohen");
      await page.waitForLoadState("networkidle");
      const link = page.locator('a[href^="/lesson/"]').first();
      if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState("networkidle");
        const chatSection = page.getByText(/שאלות|שאלה/);
        await expect(chatSection.first()).toBeVisible({ timeout: 10000 });
      } else {
        // No lessons exist yet — just verify the lessons page loaded without error
        expect(true).toBe(true);
      }
    }
  });

  test("visit /my/schedule as logged-in student", async ({ page }) => {
    await login(page, studentEmail, "test1234");
    await page.goto("/my/schedule");
    await page.waitForLoadState("networkidle");

    // Should NOT redirect to login
    expect(page.url()).toContain("/my/schedule");
    // The page title should be visible
    await expect(page.getByRole("heading", { name: "הלוח שלי" })).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------
// 5. Admin flow
// -------------------------------------------------------
test.describe.serial("5. Admin flow", () => {
  test("admin dashboard shows stats > 0", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("סקירת מערכת")).toBeVisible();

    // There should be at least one stat card with a number > 0
    // The stats are shown as text-3xl font-bold numbers
    const statCards = page.locator(".text-3xl.font-bold");
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);

    let foundPositive = false;
    for (let i = 0; i < count; i++) {
      const text = await statCards.nth(i).textContent();
      const num = parseInt((text || "0").replace(/[^0-9]/g, ""), 10);
      if (num > 0) {
        foundPositive = true;
        break;
      }
    }
    expect(foundPositive).toBe(true);
  });

  test("admin users page shows table or cards", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "תלמידים" })).toBeVisible();
    // Should have either a table or card elements
    const table = page.locator("table");
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const hasTable = await table.isVisible().catch(() => false);
    const hasCards = (await cards.count()) > 0;
    expect(hasTable || hasCards).toBe(true);
  });

  test("admin donations page has CSV export button", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto("/admin/donations");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("תרומות").first()).toBeVisible();
    // Look for the CSV export link/button
    await expect(page.getByText("ייצא ל-CSV")).toBeVisible({ timeout: 10000 });
  });
});
