/**
 * Inspect a single lesson — print live-related fields to diagnose 404 / black-screen.
 * Usage: node --env-file=.env --import tsx scripts/inspect-lesson.ts <lesson-id>
 */
import { db } from "@/lib/db";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: inspect-lesson.ts <lesson-id>");
    process.exit(1);
  }

  const l = await db.lesson.findUnique({
    where: { id },
    include: {
      rabbi: { select: { name: true, slug: true, status: true, isBlocked: true, photoUrl: true } },
    },
  });

  if (!l) { console.log("❌ lesson not found"); process.exit(1); }

  console.log("\n=== lesson ===");
  Object.entries(l).forEach(([k, v]) => {
    if (k === "rabbi") {
      const r = v as any;
      if (!r) return console.log("  rabbi: null");
      console.log(`  rabbi.name: ${r.name}`);
      console.log(`  rabbi.slug: ${r.slug}`);
      console.log(`  rabbi.status: ${r.status}`);
      console.log(`  rabbi.isBlocked: ${r.isBlocked}`);
      console.log(`  rabbi.photoUrl: ${r.photoUrl ? "set" : "null"}`);
      return;
    }
    console.log(`  ${k}: ${v === null ? "null" : v instanceof Date ? v.toISOString() : v}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
