import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash("password123", 10);

  const rabbi = await db.user.upsert({
    where: { email: "yosef@example.com" },
    update: {},
    create: {
      email: "yosef@example.com",
      passwordHash: pass,
      role: "RABBI",
      rabbi: {
        create: {
          name: "הרב יוסף כהן",
          slug: "yosef-cohen",
          bio: "ראש ישיבת אור החיים, מוסר שיעורים יומיים בגמרא ובהלכה כבר למעלה משלושים שנה.\nמתמחה בסוגיות ממסכת בבא מציעא ובהלכות שבת.",
          status: "APPROVED",
          categories: {
            create: [
              { name: "דף יומי", order: 1 },
              { name: "הלכה", order: 2 },
              { name: "פרשת שבוע", order: 3 },
            ],
          },
        },
      },
    },
    include: { rabbi: { include: { categories: true } } },
  });

  const cats = rabbi.rabbi!.categories;
  const daf = cats.find((c) => c.name === "דף יומי")!;
  const parsha = cats.find((c) => c.name === "פרשת שבוע")!;

  await db.lesson.createMany({
    data: [
      {
        rabbiId: rabbi.rabbi!.id,
        categoryId: daf.id,
        title: "בבא מציעא דף ל\"ב — השבת אבידה",
        description: "ניתוח הסוגיה בעקבות שיטות הראשונים.",
        scheduledAt: new Date(Date.now() + 2 * 3600 * 1000),
        durationMin: 60,
        youtubeUrl: "https://youtube.com/live/example",
        isLive: true,
        viewCount: 142,
      },
      {
        rabbiId: rabbi.rabbi!.id,
        categoryId: parsha.id,
        title: "פרשת ויקרא — קרבן יחיד וציבור",
        description: "עיון בפרשה השבועית ובמשמעות הקרבנות בימינו.",
        scheduledAt: new Date(Date.now() + 4 * 86400000),
        durationMin: 50,
      },
    ],
  });

  // תלמיד לדוגמה
  await db.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      passwordHash: pass,
      role: "STUDENT",
      student: { create: { name: "תלמיד לדוגמה" } },
    },
  });

  console.log("✓ seed הושלם");
  console.log("  רב:    yosef@example.com / password123");
  console.log("  תלמיד: student@example.com / password123");
  console.log("  אדמין: הגדר ADMIN_EMAIL ב-.env והירשם כתלמיד עם אותו מייל");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
