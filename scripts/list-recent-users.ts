/**
 * רשימת 10 המשתמשים האחרונים שנרשמו ב-DB.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/list-recent-users.ts [email]
 *
 * אם מצוין email, מחפש משתמש ספציפי במקום הרשימה.
 */
import { db } from "@/lib/db";

async function main() {
  const searchEmail = process.argv[2]?.toLowerCase().trim();

  if (searchEmail) {
    const exact = await db.user.findUnique({
      where: { email: searchEmail },
      include: { student: true, rabbi: { select: { name: true, status: true, isBlocked: true } } },
    });
    if (exact) {
      console.log(`✅ נמצא: ${exact.email}`);
      console.log(`   נרשם: ${exact.createdAt.toLocaleString("he-IL")}`);
      console.log(`   Role: ${exact.role}`);
      if (exact.student) console.log(`   Student: ${exact.student.name} (blocked: ${exact.student.isBlocked})`);
      if (exact.rabbi) console.log(`   Rabbi: ${exact.rabbi.name} (status: ${exact.rabbi.status}, blocked: ${exact.rabbi.isBlocked})`);
    } else {
      console.log(`❌ לא נמצא משתמש עם המייל "${searchEmail}"`);
    }

    // חיפוש דומה — כל מי שמכיל את הטקסט
    const similar = await db.user.findMany({
      where: { email: { contains: searchEmail.split("@")[0], mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { email: true, role: true, createdAt: true },
    });
    if (similar.length > 0 && (!exact || similar.length > 1)) {
      console.log(`\n🔍 מיילים דומים שכן קיימים:`);
      similar.forEach((u) => {
        console.log(`   - ${u.email}  [${u.role}]  נרשם ${u.createdAt.toLocaleString("he-IL")}`);
      });
    }
    return;
  }

  // רשימה כללית — 10 אחרונים
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      student: { select: { name: true, isBlocked: true } },
      rabbi: { select: { name: true, status: true, isBlocked: true } },
    },
  });

  console.log(`\n📋 10 משתמשים אחרונים:\n`);
  users.forEach((u, i) => {
    const type = u.rabbi ? `Rabbi (${u.rabbi.name})` : u.student ? `Student (${u.student.name})` : "User";
    const blocked = u.rabbi?.isBlocked || u.student?.isBlocked ? " 🚫 BLOCKED" : "";
    console.log(`${i + 1}. ${u.email}  [${u.role}] — ${type}${blocked}`);
    console.log(`   נרשם: ${u.createdAt.toLocaleString("he-IL")}\n`);
  });

  const total = await db.user.count();
  console.log(`סה"כ משתמשים ב-DB: ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
