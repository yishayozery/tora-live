/**
 * Rename a rabbi (slug + name + bio + photo).
 * Usage: node --import tsx scripts/rename-rabbi.ts <oldSlug> <newSlug> "<newName>" "<newBio>" [photoUrl]
 */
import { db } from "../lib/db";

async function main() {
  const [oldSlug, newSlug, newName, newBio, photoUrl] = process.argv.slice(2);
  if (!oldSlug || !newSlug || !newName) {
    console.error("Usage: tsx scripts/rename-rabbi.ts <oldSlug> <newSlug> <newName> [newBio] [photoUrl]");
    process.exit(1);
  }
  const rabbi = await db.rabbi.findUnique({ where: { slug: oldSlug } });
  if (!rabbi) { console.error(`❌ לא נמצא רב עם slug=${oldSlug}`); process.exit(1); }

  await db.rabbi.update({
    where: { id: rabbi.id },
    data: {
      slug: newSlug,
      name: newName,
      ...(newBio ? { bio: newBio } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
    },
  });
  // עדכן גם את האימייל של ה-User כדי שיתאים ל-slug החדש
  await db.user.update({
    where: { id: rabbi.userId },
    data: { email: `${newSlug}@external.tora-live.co.il` },
  });
  const lessonsCount = await db.lesson.count({ where: { rabbiId: rabbi.id } });
  console.log(`✅ ${rabbi.name} → ${newName}`);
  console.log(`   slug: ${oldSlug} → ${newSlug}`);
  console.log(`   ${lessonsCount} שיעורים מקושרים נשארו`);
}

main().catch((e) => { console.error(e); process.exit(1); });
