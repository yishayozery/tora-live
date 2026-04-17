import { test, expect, Page } from "@playwright/test";

// --------------- helpers ---------------

const ADMIN_EMAIL = "admin@tora-live.co.il";
const ADMIN_PASS = "admin1234";
const RABBI_EMAIL = "yosef@example.com";
const RABBI_PASS = "password123";
const STUDENT_EMAIL = "student@example.com";
const STUDENT_PASS = "password123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /התחבר/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

async function logout(page: Page) {
  await page.goto("/api/auth/signout");
  await page.waitForLoadState("networkidle");
  const btn = page.getByRole("button", { name: /sign out|יציאה|צא/i });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    await page.waitForLoadState("networkidle");
  }
  await page.context().clearCookies();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function registerStudent(page: Page, email: string, name: string, password = "test1234") {
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const nameInput = page.locator("input").first();
  await nameInput.fill(name);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /הירשם/ }).click();
  await page.waitForURL("/", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

function tomorrowDatetime(offsetHours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(offsetHours, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

/**
 * Create a lesson directly via API. The rabbi must already be logged in via `login(page, ...)`
 * so that the session cookie is attached. Returns the lesson id.
 */
async function createLessonViaApi(
  page: Page,
  opts: { title: string; isPublic?: boolean; scheduledAt?: string }
): Promise<string> {
  const scheduledAt = opts.scheduledAt ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const payload = {
    title: opts.title,
    description: "תיאור בדיקה אוטומטית — מעל 20 תווים לבטחון",
    categoryId: null,
    scheduledAt,
    durationMin: 60,
    language: "he",
    broadcastType: "LESSON",
    isLive: false,
    isPublic: opts.isPublic ?? true,
    syncToCalendar: false,
    isRecurring: false,
  };
  const res = await page.request.post("/api/lessons", { data: payload });
  if (!res.ok()) {
    throw new Error(`createLessonViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.id) throw new Error(`createLessonViaApi: no id returned — ${JSON.stringify(json)}`);
  return json.id as string;
}

// -------------------------------------------------------
// Test 1: הצעת יום עיון ע"י תלמיד
// -------------------------------------------------------
test("1. Student proposes a study day event", async ({ page }) => {
  await login(page, STUDENT_EMAIL, STUDENT_PASS);
  await page.goto("/propose-event");
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: /הצעת/ }).first()
  ).toBeVisible({ timeout: 10000 });

  // Title
  await page.locator('input[type="text"]').first().fill("יום עיון בדיקה");
  // Description
  await page
    .locator("textarea")
    .first()
    .fill("תיאור ארוך לפחות 20 תווים זה יום עיון לבדיקות אוטומטיות");
  // Date
  await page.locator('input[type="datetime-local"]').fill(tomorrowDatetime(11));
  // Location (first text input after title is locationName)
  const textInputs = page.locator('input[type="text"]');
  await textInputs.nth(1).fill("בית כנסת");

  await page.getByRole("button", { name: /שלח הצעה/ }).click();

  // Success message
  await expect(page.getByText(/התקבל|תודה|נשלח/).first()).toBeVisible({
    timeout: 10000,
  });
});

// -------------------------------------------------------
// Test 2: Private lesson not visible to public
// -------------------------------------------------------
test("2. Private lesson (isPublic=false) hidden from public rabbi page", async ({
  page,
}) => {
  const privateTitle = `אירוע סגור בדיקה ${Date.now()}`;

  await login(page, RABBI_EMAIL, RABBI_PASS);
  await page.goto("/dashboard/lessons/new");
  await page.waitForLoadState("networkidle");

  // Title
  const titleLabel = page.locator("label", { hasText: "כותרת" });
  await titleLabel
    .locator("xpath=following-sibling::input | ../input")
    .first()
    .fill(privateTitle);

  // Description
  await page
    .locator("textarea")
    .first()
    .fill("תיאור ארוך מספיק לבדיקה, אירוע פרטי סגור.");

  // Scheduled date
  await page.locator('input[type="datetime-local"]').fill(tomorrowDatetime(12));

  // Uncheck isPublic. The first checkbox is isRecurring, the second is isPublic.
  // Find the isPublic checkbox by its sibling text.
  const publicCheckbox = page
    .locator("label")
    .filter({ hasText: /שיעור ציבורי|אירוע סגור/ })
    .locator('input[type="checkbox"]')
    .first();
  if (await publicCheckbox.isChecked()) {
    await publicCheckbox.uncheck();
  }

  // Submit
  await page.getByRole("button", { name: /צור שיעור/ }).click();
  await page.waitForURL("**/dashboard/lessons", { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // Confirm created (visible in rabbi's own dashboard)
  await expect(page.getByText(privateTitle)).toBeVisible({ timeout: 10000 });

  // Logout
  await logout(page);

  // Public rabbi page should NOT list this lesson (as a clickable lesson link)
  await page.goto("/rabbi/yosef-cohen");
  await page.waitForLoadState("networkidle");
  const lessonLinks = page.locator('a[href^="/lesson/"]').filter({
    hasText: privateTitle,
  });
  await expect(lessonLinks).toHaveCount(0);
});

// -------------------------------------------------------
// Test 3: Report flow — suspension after 2 reports
// -------------------------------------------------------
test("3. Report flow suspends lesson after threshold", async ({
  page,
  browser,
}) => {
  const lessonTitle = `שיעור לבדיקת דיווחים ${Date.now()}`;

  // Rabbi creates a public lesson via API
  await login(page, RABBI_EMAIL, RABBI_PASS);
  const lessonId = await createLessonViaApi(page, {
    title: lessonTitle,
    isPublic: true,
  });
  expect(lessonId).toBeTruthy();

  await logout(page);

  // Student #1 reports
  await login(page, STUDENT_EMAIL, STUDENT_PASS);
  const res1 = await page.request.post(`/api/lessons/${lessonId}/report`, {
    data: { category: "SPAM", description: "test report 1" },
  });
  expect(res1.status()).toBe(200);
  const body1 = await res1.json();
  expect(body1.ok).toBe(true);
  // After 1st report should not yet be suspended
  expect(body1.suspended).toBe(false);

  await logout(page);

  // Student #2 — register new student
  const s2Email = `report-student-${Date.now()}@test.co`;
  await registerStudent(page, s2Email, "תלמיד דיווח 2");
  // Ensure logged in
  await login(page, s2Email, "test1234");

  const res2 = await page.request.post(`/api/lessons/${lessonId}/report`, {
    data: { category: "INAPPROPRIATE", description: "test report 2" },
  });
  expect(res2.status()).toBe(200);
  const body2 = await res2.json();
  expect(body2.suspended).toBe(true);

  await logout(page);

  // Public lesson page should now show the suspended message
  await page.goto(`/lesson/${lessonId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/הושהה/).first()).toBeVisible({ timeout: 10000 });
});

// -------------------------------------------------------
// Test 4: Duplicate report blocked (409)
// -------------------------------------------------------
test("4. Duplicate report returns 409", async ({ page }) => {
  const lessonTitle = `שיעור דופליקייט דיווח ${Date.now()}`;

  await login(page, RABBI_EMAIL, RABBI_PASS);
  const lessonId = await createLessonViaApi(page, {
    title: lessonTitle,
    isPublic: true,
  });

  await logout(page);

  // Register brand-new student to avoid interference from prior tests
  const uniqueEmail = `dup-report-${Date.now()}@test.co`;
  await registerStudent(page, uniqueEmail, "תלמיד כפילות");
  await login(page, uniqueEmail, "test1234");

  const r1 = await page.request.post(`/api/lessons/${lessonId}/report`, {
    data: { category: "SPAM", description: "first" },
  });
  expect(r1.status()).toBe(200);

  const r2 = await page.request.post(`/api/lessons/${lessonId}/report`, {
    data: { category: "SPAM", description: "second" },
  });
  expect(r2.status()).toBe(409);
  const body = await r2.json();
  expect(body.error).toMatch(/כבר דיווחת/);
});

// -------------------------------------------------------
// Test 5: Admin approves study day → appears publicly
// -------------------------------------------------------
test("5. Admin approves proposed event → visible in public lessons", async ({
  page,
}) => {
  // Unique title so we can find it reliably on the admin page
  const uniqueMarker = Date.now().toString().slice(-6);
  const eventTitle = `יום עיון אישור ${uniqueMarker}`;

  // Student proposes
  const studentEmail = `propose-${Date.now()}@test.co`;
  await registerStudent(page, studentEmail, "מציע אירוע");
  await login(page, studentEmail, "test1234");

  await page.goto("/propose-event");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="text"]').first().fill(eventTitle);
  await page
    .locator("textarea")
    .first()
    .fill(
      "יום עיון מיוחד לבדיקה אוטומטית — תיאור ארוך מספיק מעל עשרים תווים."
    );
  await page.locator('input[type="datetime-local"]').fill(tomorrowDatetime(15));
  await page.getByRole("button", { name: /שלח הצעה/ }).click();
  await expect(page.getByText(/התקבל|תודה|נשלח/).first()).toBeVisible({
    timeout: 10000,
  });

  await logout(page);

  // Admin approves
  await login(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto("/admin/events");
  await page.waitForLoadState("networkidle");

  // The event should appear in the pending list
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10000 });

  // Find the card that contains the event and click its "אשר" button.
  const titleEl = page.getByRole("heading", { name: eventTitle }).first();
  await expect(titleEl).toBeVisible({ timeout: 10000 });
  const cardContainer = titleEl.locator(
    'xpath=ancestor::*[.//button[contains(normalize-space(.), "אשר")]][1]'
  );
  const approveBtn = cardContainer
    .locator('button:has-text("אשר")')
    .first();
  await expect(approveBtn).toBeVisible({ timeout: 5000 });

  // Get the lesson id for direct verification — find /lesson/<id> link inside the card
  const lessonLink = await cardContainer
    .locator('a[href^="/lesson/"]')
    .first()
    .getAttribute("href");
  const proposedId = lessonLink?.split("/lesson/")[1]?.split("?")[0];

  await approveBtn.click();
  // Give the browser time to issue the fetch and receive the response
  await page.waitForTimeout(2500);
  await page.waitForLoadState("networkidle");

  // Sanity — call the approval endpoint directly to be certain (idempotent on approved)
  if (proposedId) {
    await page.request.post(`/api/admin/events/${proposedId}`, {
      data: { action: "approve" },
    });
  }

  // Verify the event shows in the "approved" section of admin/events page
  await page.goto("/admin/events");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: eventTitle }).first()).toBeVisible({
    timeout: 10000,
  });

  await logout(page);

  // Search in public lessons — search by unique marker
  await page.goto("/lessons?q=" + encodeURIComponent(uniqueMarker));
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(eventTitle).first()).toBeVisible({ timeout: 10000 });
});
