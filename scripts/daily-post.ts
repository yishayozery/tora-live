/**
 * Daily Post — מייצר פוסטים שיווקיים (WhatsApp/Telegram/Blog) לשיעורי היום והמחר.
 *
 * Usage:
 *   tsx scripts/daily-post.ts
 *   tsx scripts/daily-post.ts --date=2026-04-25
 *   tsx scripts/daily-post.ts --format=whatsapp
 */
import * as fs from "fs/promises";
import * as path from "path";
import { db } from "../lib/db";
import { formatHebrewDate, formatHebrewTime } from "../lib/utils";

type LessonWithRabbi = Awaited<ReturnType<typeof fetchLessons>>[number];

const SITE = "https://torah-live-rho.vercel.app";

async function fetchLessons(from: Date, to: Date) {
  return db.lesson.findMany({
    where: {
      scheduledAt: { gte: from, lte: to },
      approvalStatus: "APPROVED",
      isPublic: true,
      isSuspended: false,
    },
    include: {
      rabbi: { select: { name: true, slug: true } },
      category: { select: { name: true } },
      _count: { select: { bookmarks: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

function selectTopLessons(lessons: LessonWithRabbi[], max: number): LessonWithRabbi[] {
  const live = lessons.filter((l) => l.isLive);
  const rest = lessons.filter((l) => !l.isLive);
  rest.sort((a, b) => b._count.bookmarks - a._count.bookmarks || a.scheduledAt.getTime() - b.scheduledAt.getTime());
  // פיזור קטגוריות: השתדל לא להביא 3 באותה קטגוריה
  const seen = new Set<string>();
  const picked: LessonWithRabbi[] = [];
  for (const l of live) picked.push(l);
  for (const l of rest) {
    if (picked.length >= max) break;
    const cat = l.category?.name ?? "_none";
    if (picked.filter((p) => (p.category?.name ?? "_none") === cat).length >= 2) continue;
    seen.add(cat);
    picked.push(l);
  }
  return picked.slice(0, max);
}

function rabbiLabel(l: LessonWithRabbi): string {
  return l.rabbi?.name ?? l.organizerName ?? "רב";
}

function lessonUrl(l: LessonWithRabbi): string {
  return `${SITE}/lesson/${l.id}`;
}

function buildWhatsApp(today: LessonWithRabbi[], tomorrow: LessonWithRabbi[]): string {
  const lines: string[] = [];
  lines.push("🎓 *שיעורי תורה היום ב-TORA_LIVE*", "");

  const liveNow = today.filter((l) => l.isLive);
  if (liveNow.length) {
    lines.push("🔴 *עכשיו בשידור חי:*");
    for (const l of liveNow.slice(0, 2)) {
      lines.push(`• ${rabbiLabel(l)} — ${l.title}`);
      lines.push(`  👈 ${lessonUrl(l)}`);
    }
    lines.push("");
  }

  const laterToday = today.filter((l) => !l.isLive).slice(0, 4);
  if (laterToday.length) {
    lines.push("⏰ *בהמשך היום:*");
    for (const l of laterToday) {
      lines.push(`• ${formatHebrewTime(l.scheduledAt)} | ${rabbiLabel(l)} — ${l.title}`);
    }
    lines.push("");
  }

  const tomorrowTop = tomorrow.slice(0, 2);
  if (tomorrowTop.length) {
    lines.push("🗓️ *מחר:*");
    for (const l of tomorrowTop) {
      lines.push(`• ${formatHebrewTime(l.scheduledAt)} | ${rabbiLabel(l)} — ${l.title}`);
    }
    lines.push("");
  }

  lines.push("צפייה חינם, ללא הרשמה 👇", SITE);
  return lines.join("\n");
}

function buildTelegram(today: LessonWithRabbi[], tomorrow: LessonWithRabbi[]): string {
  const lines: string[] = [];
  lines.push(`# 🎓 שיעורי תורה — ${formatHebrewDate(new Date())}`, "");

  const liveNow = today.filter((l) => l.isLive);
  if (liveNow.length) {
    lines.push("## 🔴 עכשיו בשידור חי");
    for (const l of liveNow) {
      lines.push(`**${rabbiLabel(l)}** — ${l.title}`);
      if (l.description) lines.push(`_${l.description.slice(0, 100)}..._`);
      lines.push(`[לצפייה](${lessonUrl(l)})`, "");
    }
  }

  const laterToday = today.filter((l) => !l.isLive);
  if (laterToday.length) {
    lines.push("## ⏰ בהמשך היום");
    for (const l of laterToday.slice(0, 5)) {
      lines.push(`- **${formatHebrewTime(l.scheduledAt)}** — ${rabbiLabel(l)}: [${l.title}](${lessonUrl(l)})`);
    }
    lines.push("");
  }

  if (tomorrow.length) {
    lines.push("## 🗓️ מחר");
    for (const l of tomorrow.slice(0, 3)) {
      lines.push(`- **${formatHebrewTime(l.scheduledAt)}** — ${rabbiLabel(l)}: [${l.title}](${lessonUrl(l)})`);
    }
    lines.push("");
  }

  lines.push("---", `🔗 הצטרפו בחינם: ${SITE}`);
  return lines.join("\n");
}

function buildBlog(today: LessonWithRabbi[], tomorrow: LessonWithRabbi[]): string {
  const dateLabel = formatHebrewDate(new Date());
  const count = today.length + tomorrow.length;
  const lines: string[] = [];
  lines.push(`---`);
  lines.push(`title: "שיעורי התורה של ${dateLabel} | TORA_LIVE"`);
  lines.push(`description: "${count} שיעורי תורה בשידור חי ובמתוזמן היום ומחר — דף יומי, פרשת שבוע, הלכה ומחשבה"`);
  lines.push(`date: "${new Date().toISOString().slice(0, 10)}"`);
  lines.push(`---`, "");
  lines.push(`# שיעורי התורה של ${dateLabel}`, "");
  lines.push(`ב-TORA_LIVE אנחנו מרכזים את שיעורי התורה של רבני המגזר הדתי-לאומי והחרדל״י — בשידור חי, במתוזמן ובהקלטה. הנה השיעורים הבולטים להיום ולמחר:`, "");

  if (today.length) {
    lines.push(`## שיעורי היום`, "");
    for (const l of today) {
      lines.push(`### ${l.title}`);
      lines.push(`**${rabbiLabel(l)}** · ${formatHebrewTime(l.scheduledAt)}${l.category ? ` · ${l.category.name}` : ""}`, "");
      if (l.description) lines.push(l.description.slice(0, 250), "");
      lines.push(`[צפייה בשיעור →](${lessonUrl(l)})`, "");
    }
  }

  if (tomorrow.length) {
    lines.push(`## מחר`, "");
    for (const l of tomorrow) {
      lines.push(`- **${formatHebrewTime(l.scheduledAt)}** — ${rabbiLabel(l)}: [${l.title}](${lessonUrl(l)})`);
    }
    lines.push("");
  }

  lines.push(`---`, "");
  lines.push(`**TORA_LIVE** — פלטפורמה חינמית לשיעורי תורה אונליין. הצטרפו בחינם: [${SITE}](${SITE})`);
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const dateArg = args.find((a) => a.startsWith("--date="));
  const formatArg = args.find((a) => a.startsWith("--format="));
  const baseDate = dateArg ? new Date(dateArg.split("=")[1]) : new Date();
  const format = formatArg?.split("=")[1];

  const startOfDay = new Date(baseDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setHours(23, 59, 59, 999);
  const endOfTomorrow = new Date(startOfDay); endOfTomorrow.setDate(endOfTomorrow.getDate() + 2); endOfTomorrow.setHours(0, 0, 0, 0);

  // מעכשיו עד סוף היום
  const nowOrStart = baseDate > startOfDay ? baseDate : startOfDay;
  const todayLessons = await fetchLessons(nowOrStart, endOfDay);
  const tomorrowRaw = await fetchLessons(endOfDay, endOfTomorrow);

  const today = selectTopLessons(todayLessons, 5);
  const tomorrow = selectTopLessons(tomorrowRaw, 3);

  if (today.length + tomorrow.length < 2) {
    const out = { skipped: true, reason: "too-few-lessons", todayCount: todayLessons.length, tomorrowCount: tomorrowRaw.length };
    console.log(JSON.stringify(out, null, 2));
    console.log("\n💡 הצעה: להוסיף ערוצי מקור חדשים ב-/admin/sources, או לפנות לרבנים דרך סוכן rabbi-outreach");
    return;
  }

  const outDir = path.join(process.cwd(), "data", "posts", startOfDay.toISOString().slice(0, 10));
  await fs.mkdir(outDir, { recursive: true });

  const files: Record<string, string> = {};
  if (!format || format === "whatsapp") files["whatsapp.txt"] = buildWhatsApp(today, tomorrow);
  if (!format || format === "telegram") files["telegram.md"] = buildTelegram(today, tomorrow);
  if (!format || format === "blog")     files["blog.md"]     = buildBlog(today, tomorrow);

  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(outDir, name), content, "utf8");
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    today: today.map((l) => ({ id: l.id, title: l.title, rabbi: rabbiLabel(l), at: l.scheduledAt })),
    tomorrow: tomorrow.map((l) => ({ id: l.id, title: l.title, rabbi: rabbiLabel(l), at: l.scheduledAt })),
  };
  await fs.writeFile(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(`✅ Generated ${Object.keys(files).length} posts → ${outDir}`);
  for (const [name, content] of Object.entries(files)) {
    console.log(`\n━━━━━━━━━━ ${name} ━━━━━━━━━━`);
    console.log(content);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
