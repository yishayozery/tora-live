/**
 * מאפס סיסמאות לרבנים שנוצרו ע"י import-rabbi-past (אימייל מסתיים ב-@external.tora-live.co.il).
 * Usage: node --import tsx scripts/reset-imported-rabbi-passwords.ts <newPassword>
 */
import { db } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const newPassword = process.argv[2] || "rabbi1234";
  const hash = await bcrypt.hash(newPassword, 10);

  const users = await db.user.findMany({
    where: { email: { endsWith: "@external.tora-live.co.il" } },
    include: { rabbi: { select: { name: true, slug: true } } },
  });

  if (users.length === 0) {
    console.log("❌ לא נמצאו רבנים מיובאים");
    process.exit(0);
  }

  console.log(`🔑 מאפס סיסמאות ל-${users.length} רבנים → "${newPassword}"\n`);
  for (const u of users) {
    await db.user.update({ where: { id: u.id }, data: { passwordHash: hash } });
    console.log(`✅ ${u.rabbi?.name ?? "—"}`);
    console.log(`   מייל:   ${u.email}`);
    console.log(`   slug:   ${u.rabbi?.slug ?? "—"}`);
    console.log("");
  }
  console.log(`🔐 סיסמה אחידה: ${newPassword}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
