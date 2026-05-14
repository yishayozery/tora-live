/**
 * יוצר/מעדכן משתמש אדמין ב-DB.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/reset-admin.ts
 *
 * הסיסמה: ADMIN_RESET_PASSWORD (env var) או "AdminTora!2026" כברירת מחדל.
 * המייל: ADMIN_EMAIL (env var) או "admin@tora-live.co.il".
 */
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@tora-live.co.il").toLowerCase().trim();
  const password = process.env.ADMIN_RESET_PASSWORD ?? "AdminTora!2026";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
  });

  // יוצר Student row אם לא קיים — מאפשר לאדמין להשתמש בפיצ'רים של תלמיד (סימוניות, התראות).
  // ובכל מקרה — מבטל חסימה (isBlocked=false) למקרה ש-Student קיים וחסום משוטף קודם.
  await db.student.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: "אדמין",
      isBlocked: false,
    },
    update: {
      isBlocked: false,
      blockedReason: null,
    },
  });

  // גם Rabbi (אם יש כזה למייל הזה) — מבטל חסימה
  await db.rabbi.updateMany({
    where: { userId: user.id },
    data: { isBlocked: false },
  });

  console.log("✅ Admin ready");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ADMIN`);
  console.log(`\n⚠️  שנה את הסיסמה אחרי הכניסה הראשונה.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
