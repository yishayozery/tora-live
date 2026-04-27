/**
 * יוצר רב לבדיקה מלאה — עם תמונה, ביוגרפיה, וכמה שיעורים.
 *
 * Usage:
 *   tsx scripts/create-test-rabbi.ts
 *
 * סוקס: יוצר אם לא קיים, מעדכן תמונה אם קיים.
 */
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// תמונת פרופיל לדוגמה — תמונה מ-DiceBear (חינם ופתוח, משתמשת ב-data URL)
const TEST_RABBI_PHOTO_DATA_URL = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#bg)"/>
  <text x="100" y="115" font-family="Georgia,serif" font-size="80" fill="#F5E9C8" text-anchor="middle" font-weight="bold">דצ</text>
</svg>`);

const TEST_RABBI = {
  email: "test.rabbi@tora-live.co.il",
  password: "test123456",
  name: "הרב דוד צדיק (לבדיקה)",
  slug: "rabbi-david-tzadik-test",
  phone: "+972501234567",
  bio: `הרב דוד צדיק שליט"א, ראש ישיבת התורה והעבודה ברמת גן.
מומחה בהלכות שבת, פרשת שבוע, וענייני אמונה.
שיעורים שבועיים בהלכה יומית בימים ראשון ושלישי בערב.

[חשבון לבדיקה — נוצר אוטומטית. תמונה דמה.]`,
  photoUrl: TEST_RABBI_PHOTO_DATA_URL,
};

async function main() {
  console.log("🌱 Creating test rabbi...");

  const passwordHash = await bcrypt.hash(TEST_RABBI.password, 10);

  // Upsert User
  const user = await db.user.upsert({
    where: { email: TEST_RABBI.email },
    update: { passwordHash },
    create: {
      email: TEST_RABBI.email,
      passwordHash,
      role: "RABBI",
    },
  });
  console.log(`  ✅ User: ${user.email} (${user.id})`);

  // Upsert Rabbi
  const existing = await db.rabbi.findUnique({ where: { userId: user.id } });
  let rabbi;
  if (existing) {
    rabbi = await db.rabbi.update({
      where: { id: existing.id },
      data: {
        name: TEST_RABBI.name,
        bio: TEST_RABBI.bio,
        photoUrl: TEST_RABBI.photoUrl,
        phone: TEST_RABBI.phone,
        status: "APPROVED",
        isBlocked: false,
        profileCompleted: true,
      },
    });
    console.log(`  🔄 Rabbi updated: ${rabbi.name}`);
  } else {
    rabbi = await db.rabbi.create({
      data: {
        userId: user.id,
        slug: TEST_RABBI.slug,
        name: TEST_RABBI.name,
        bio: TEST_RABBI.bio,
        photoUrl: TEST_RABBI.photoUrl,
        phone: TEST_RABBI.phone,
        status: "APPROVED",
        isBlocked: false,
        profileCompleted: true,
      },
    });
    console.log(`  ✨ Rabbi created: ${rabbi.name}`);
  }

  // 3 שיעורי דוגמה — אחד עתידי, אחד נוכחי, אחד עבר
  const now = new Date();
  const lessons = [
    {
      title: "שיעור הלכה — הלכות שבת (חלק א׳)",
      scheduledAt: new Date(now.getTime() + 2 * 86400_000), // עוד יומיים
      durationMin: 60,
    },
    {
      title: "פרשת השבוע — אחרי-קדושים",
      scheduledAt: new Date(now.getTime() + 5 * 86400_000),
      durationMin: 45,
    },
    {
      title: "מחשבת ישראל — אמונה ובחירה (הקלטה)",
      scheduledAt: new Date(now.getTime() - 7 * 86400_000), // לפני שבוע
      durationMin: 75,
    },
  ];

  for (const l of lessons) {
    const exists = await db.lesson.findFirst({
      where: { rabbiId: rabbi.id, title: l.title },
    });
    if (exists) {
      console.log(`  ⏭️  Lesson exists: ${l.title.slice(0, 40)}...`);
      continue;
    }
    await db.lesson.create({
      data: {
        rabbiId: rabbi.id,
        title: l.title,
        description: `${l.title} — שיעור לדוגמה לבדיקת המערכת.`,
        scheduledAt: l.scheduledAt,
        durationMin: l.durationMin,
        broadcastType: "LESSON",
        language: "he",
        isPublic: true,
        approvalStatus: "APPROVED",
      },
    });
    console.log(`  ✨ Lesson created: ${l.title.slice(0, 40)}...`);
  }

  console.log("\n=== סיכום ===");
  console.log(`רב: ${rabbi.name}`);
  console.log(`Email: ${TEST_RABBI.email}`);
  console.log(`Password: ${TEST_RABBI.password}`);
  console.log(`URL: /rabbi/${rabbi.slug}`);
  console.log(`Status: ${rabbi.status} (${rabbi.profileCompleted ? "פרופיל מלא" : "פרופיל חלקי"})`);
  console.log(`תמונה: ${rabbi.photoUrl ? "✅" : "❌"}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("💥", e); process.exit(1); });
