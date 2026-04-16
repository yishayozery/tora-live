import { test, expect, type Page } from "@playwright/test";

/**
 * E2E API tests for TORA_LIVE.
 *
 * Runs serially — later tests depend on data created by earlier ones.
 * Uses the dev-seeded database (yosef@example.com, student@example.com).
 *
 * Auth strategy: login via UI on a shared page, then use page.request
 * (which inherits the browser context cookies) for API calls within the
 * same test.  Because page.request is scoped to the page fixture's
 * lifetime, every authenticated API call must happen in a test that
 * receives { page }.
 */

const BASE = "http://localhost:3000";
const UNIQUE = Date.now();

// ——— helpers ———

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /התחבר/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10_000,
  });
}

function lessonPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: `שיעור בדיקה ${UNIQUE}`,
    description: "תיאור שיעור לבדיקות אוטומטיות",
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
    durationMin: 45,
    ...overrides,
  };
}

// ——— shared state ———
let createdLessonId: string;
let rabbiId: string;

// =================================================================
//  1. Registration + Auth (no auth needed)
// =================================================================
test.describe.serial("Registration + Auth", () => {
  const studentEmail = `student-${UNIQUE}@test.com`;
  const rabbiEmail = `rabbi-${UNIQUE}@test.com`;

  test("1 — register student (200)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/student`, {
      data: { name: "תלמיד טסט", email: studentEmail, password: "password123" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("2 — register student duplicate email (409)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/student`, {
      data: { name: "כפול", email: studentEmail, password: "password123" },
    });
    expect(res.status()).toBe(409);
  });

  test("3 — register student bad email (400)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/student`, {
      data: { name: "שם", email: "not-an-email", password: "password123" },
    });
    expect(res.status()).toBe(400);
  });

  test("4 — register student short password (400)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/student`, {
      data: { name: "שם", email: "short@test.com", password: "12" },
    });
    expect(res.status()).toBe(400);
  });

  test("5 — register rabbi (200)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/rabbi`, {
      data: { name: "הרב טסט", email: rabbiEmail, password: "password123" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("6 — register rabbi duplicate email (409)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/rabbi`, {
      data: { name: "הרב טסט", email: rabbiEmail, password: "password123" },
    });
    expect(res.status()).toBe(409);
  });
});

// =================================================================
//  2. Lessons API (rabbi auth)
// =================================================================
test.describe.serial("Lessons API (rabbi)", () => {
  test("7+8 — login as rabbi + create lesson (200)", async ({ page }) => {
    await loginViaUI(page, "yosef@example.com", "password123");

    const res = await page.request.post(`${BASE}/api/lessons`, {
      data: lessonPayload(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBeTruthy();
    createdLessonId = body.id;
  });

  test("9 — create lesson without title (400)", async ({ page }) => {
    await loginViaUI(page, "yosef@example.com", "password123");
    const res = await page.request.post(`${BASE}/api/lessons`, {
      data: lessonPayload({ title: "" }),
    });
    expect(res.status()).toBe(400);
  });

  test("10 — update lesson (200)", async ({ page }) => {
    await loginViaUI(page, "yosef@example.com", "password123");
    const res = await page.request.put(`${BASE}/api/lessons/${createdLessonId}`, {
      data: lessonPayload({ title: `שיעור מעודכן ${UNIQUE}` }),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("11 — delete lesson (200)", async ({ page }) => {
    await loginViaUI(page, "yosef@example.com", "password123");
    // create a throwaway lesson to delete
    const createRes = await page.request.post(`${BASE}/api/lessons`, {
      data: lessonPayload({ title: `שיעור למחיקה ${UNIQUE}` }),
    });
    const { id } = await createRes.json();
    const res = await page.request.delete(`${BASE}/api/lessons/${id}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("12 — create lesson without auth (redirect 307)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/lessons`, {
      data: lessonPayload(),
      maxRedirects: 0,
    });
    expect(res.status()).toBe(307);
  });
});

// =================================================================
//  3. Follow + Bookmark (student auth)
// =================================================================
test.describe.serial("Follow + Bookmark", () => {
  test("13+resolve — login as student + resolve rabbiId", async ({ page }) => {
    await loginViaUI(page, "student@example.com", "password123");

    // Navigate to rabbi page and extract rabbiId from RSC payload
    await page.goto("/rabbi/yosef-cohen");
    await page.waitForLoadState("networkidle");

    // Extract rabbiId from page HTML — RSC serializes props as escaped JSON
    const html = await page.content();
    // Format in RSC payload: rabbiId\":\"<cuid>\"
    const m = html.match(/rabbiId[\\"]+"?:?[\\"]+"?([c][a-z0-9]{20,30})/);
    if (m) rabbiId = m[1];

    expect(rabbiId).toBeTruthy();
  });

  test("14 — follow rabbi (200)", async ({ page }) => {
    test.skip(!rabbiId, "rabbiId not resolved");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.post(`${BASE}/api/follow/${rabbiId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.following).toBe(true);
  });

  test("15 — unfollow rabbi (200)", async ({ page }) => {
    test.skip(!rabbiId, "rabbiId not resolved");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.delete(`${BASE}/api/follow/${rabbiId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.following).toBe(false);
  });

  test("16 — bookmark lesson (200)", async ({ page }) => {
    test.skip(!createdLessonId, "No lesson available");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.post(`${BASE}/api/bookmarks/${createdLessonId}`, {
      data: {},
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("17 — remove bookmark (200)", async ({ page }) => {
    test.skip(!createdLessonId, "No lesson available");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.delete(`${BASE}/api/bookmarks/${createdLessonId}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});

// =================================================================
//  4. Notifications + Settings (student auth)
// =================================================================
test.describe.serial("Notifications + Settings", () => {
  test("18 — mark notifications read (200)", async ({ page }) => {
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.post(`${BASE}/api/me/notifications`, {
      data: {},
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("19 — update settings to EMAIL (200)", async ({ page }) => {
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.put(`${BASE}/api/me/settings`, {
      data: { notifyChannel: "EMAIL" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("20 — WHATSAPP without phone (400)", async ({ page }) => {
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.put(`${BASE}/api/me/settings`, {
      data: { notifyChannel: "WHATSAPP" },
    });
    expect(res.status()).toBe(400);
  });
});

// =================================================================
//  5. Contact (no auth)
// =================================================================
test.describe.serial("Contact", () => {
  test("21 — contact form (200)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/contact`, {
      data: {
        name: "בודק בדיקות",
        email: "tester@example.com",
        topic: "בדיקת מערכת",
        message: "זוהי הודעה לבדיקת טופס צור קשר, אנא התעלמו.",
      },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("22 — contact without message (400)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/contact`, {
      data: {
        name: "בודק",
        email: "tester@example.com",
        topic: "שאלה",
      },
    });
    expect(res.status()).toBe(400);
  });
});

// =================================================================
//  6. Admin
// =================================================================
test.describe.serial("Admin", () => {
  test("23a — register admin user", async ({ request }) => {
    const res = await request.post(`${BASE}/api/register/student`, {
      data: {
        name: "אדמין טסט",
        email: "admin@tora-live.co.il",
        password: "admin1234",
      },
    });
    expect([200, 409]).toContain(res.status());
  });

  test("23b+24 — login as admin + approve rabbi", async ({ page }) => {
    await loginViaUI(page, "admin@tora-live.co.il", "admin1234");

    if (rabbiId) {
      const res = await page.request.post(`${BASE}/api/admin/rabbis/${rabbiId}`, {
        data: { action: "approve" },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).ok).toBe(true);
    }
  });

  test("25 — export donations CSV (200 + text/csv)", async ({ page }) => {
    await loginViaUI(page, "admin@tora-live.co.il", "admin1234");
    const res = await page.request.get(`${BASE}/api/admin/donations/export.csv`);
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] || "";
    expect(ct).toContain("text/csv");
  });
});

// =================================================================
//  7. Chat
// =================================================================
test.describe.serial("Chat", () => {
  test("26+27 — login as student + GET lesson chat (200 + array)", async ({ page }) => {
    test.skip(!createdLessonId, "No lesson available");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.get(`${BASE}/api/lessons/${createdLessonId}/chat`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("28 — POST lesson chat (200/201)", async ({ page }) => {
    test.skip(!createdLessonId, "No lesson available");
    await loginViaUI(page, "student@example.com", "password123");
    const res = await page.request.post(`${BASE}/api/lessons/${createdLessonId}/chat`, {
      data: { content: "שאלה לבדיקה — האם זה עובד?" },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });
});
