/**
 * Backfill posterUrl on auto-discovered lessons.
 * Uses Wikimedia commons + Unsplash CC0 images.
 */
import { db } from "../lib/db";

// תמונות פתוחות (Wikimedia / Unsplash) — לפי מקור
const POSTERS = {
  kotel: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Western_Wall_Plaza_Jerusalem_at_Night.jpg/1200px-Western_Wall_Plaza_Jerusalem_at_Night.jpg",
  herzl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Mount_Herzl_torch-lighting.jpg/1200px-Mount_Herzl_torch-lighting.jpg",
  flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Israel.svg/1200px-Flag_of_Israel.svg.png",
  yadVashem: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Yad_Vashem_Holocaust_History_Museum.jpg/1200px-Yad_Vashem_Holocaust_History_Museum.jpg",
  musayof: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Musayoff-synagogue.jpg/1200px-Musayoff-synagogue.jpg",
  beitMidrash: "https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=1200&q=80",  // generic Torah/synagogue
  torah: "https://images.unsplash.com/photo-1585036156261-1b1b03dee92f?w=1200&q=80",
  davidTower: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Tower_of_David_Jerusalem.jpg/1200px-Tower_of_David_Jerusalem.jpg",
  meir: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Machon_Meir.jpg/1200px-Machon_Meir.jpg",
};

function pickPoster(lesson: { title: string; organizerName: string | null; locationName: string | null }): string {
  const text = `${lesson.title} ${lesson.organizerName ?? ""} ${lesson.locationName ?? ""}`;

  if (text.includes("כותל") || text.includes("Kotel")) return POSTERS.kotel;
  if (text.includes("הר הרצל") || text.includes("משואות") || text.includes("טקס יום הזיכרון") || text.includes("טקס המשואות")) return POSTERS.herzl;
  if (text.includes("יום העצמאות") || text.includes("עצמאות")) return POSTERS.flag;
  if (text.includes("יד ושם") || text.includes("שואה")) return POSTERS.yadVashem;
  if (text.includes("מוסאיוף")) return POSTERS.musayof;
  if (text.includes("מגדל דוד")) return POSTERS.davidTower;
  if (text.includes("מכון מאיר") || text.includes("מאיר")) return POSTERS.meir;

  // לפי נושא
  if (text.includes("גמרא") || text.includes("דף יומי")) return POSTERS.beitMidrash;
  return POSTERS.torah;
}

async function main() {
  const lessons = await db.lesson.findMany({
    where: { autoDiscovered: true, posterUrl: null },
    select: { id: true, title: true, organizerName: true, locationName: true },
  });
  console.log(`📷 Backfilling posters for ${lessons.length} lessons...`);

  let updated = 0;
  for (const l of lessons) {
    const posterUrl = pickPoster(l);
    await db.lesson.update({ where: { id: l.id }, data: { posterUrl } });
    updated++;
  }

  console.log(`✅ עודכנו ${updated} שיעורים עם תמונת poster`);
}

main().catch((e) => { console.error(e); process.exit(1); });
