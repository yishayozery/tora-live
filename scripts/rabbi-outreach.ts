/**
 * Rabbi Outreach — מייצר חבילת פנייה אישית לרב.
 *
 * Usage:
 *   tsx scripts/rabbi-outreach.ts --name="הרב אורי שרקי" --yeshiva="מכון מאיר" --youtube=UCxxxx --hook="בוגר ישיבת מרכז הרב"
 *
 * הסקריפט מייצר template מלא ב-data/outreach/<slug>/.
 * הוא לא מבצע WebFetch/WebSearch אוטומטית (עדיף שהסוכן rabbi-outreach יעשה זאת דרך Claude).
 * הקוד כאן הוא *שלד* — ה-founder/סוכן ממלא את החלקים החסרים בצורה אישית.
 */
import * as fs from "fs/promises";
import * as path from "path";

type Args = {
  name: string;
  yeshiva?: string;
  youtube?: string;
  website?: string;
  hook?: string;
  phone?: string;
  email?: string;
  style?: "formal" | "warm" | "short";
};

const FOUNDER_NAME = process.env.FOUNDER_NAME || "[שם ה-founder]";
const SITE = "https://torah-live-rho.vercel.app";

function parseArgs(): Args {
  const out: any = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  if (!out.name) {
    console.error("Usage: tsx scripts/rabbi-outreach.ts --name=\"הרב X\" [--yeshiva=...] [--hook=...]");
    process.exit(1);
  }
  return out as Args;
}

function slugify(name: string): string {
  return name.replace(/הרב\s+/g, "").trim().replace(/\s+/g, "-").toLowerCase();
}

function buildWhatsApp(a: Args): string {
  const hook = a.hook ? `${a.hook}\n\n` : "";
  const painPoint = a.youtube
    ? "חשבתי שזה יכול להיות שימושי לריכוז השיעורים שלך במקום אחד, עם לוח מסודר שתלמידים מוצאים אותם בקלות"
    : "חשבתי שזה יכול לעזור לך להגיע לקהל רחב יותר של תלמידים מחפשים";

  return [
    `שלום כבוד הרב ${a.name.replace(/^הרב\s+/, "")},`,
    "",
    hook + `בניתי פלטפורמה בשם TORA_LIVE (${SITE}) שמרכזת שיעורי תורה אונליין לרבני המגזר הדתי-לאומי והחרדל״י. זה חינם לגמרי, ו${painPoint}.`,
    "",
    "האם הרב יהיה פנוי ל-15 דקות שיחה או הדגמה קצרה? אני יכול גם להקים את הדף מראש ולשלוח לך לראות, ואז להחליט.",
    "",
    "בברכה,",
    FOUNDER_NAME,
  ].join("\n");
}

function buildEmail(a: Args): string {
  return [
    `נושא: הצעה לשיתוף פעולה — פלטפורמת TORA_LIVE לשיעורי תורה`,
    "",
    `שלום כבוד הרב ${a.name.replace(/^הרב\s+/, "")},`,
    "",
    a.hook ? `${a.hook}.` : "",
    "",
    `שמי ${FOUNDER_NAME}, ובניתי פלטפורמה חדשה בשם TORA_LIVE שמטרתה לרכז את שיעורי התורה של רבני המגזר הדתי-לאומי והחרדל״י במקום אחד — נגיש, חינמי, ועם כלים שיעזרו לרב להגיע לתלמידים.`,
    "",
    `**מה הפלטפורמה נותנת לרב:**`,
    `• דף אישי מקצועי — ${SITE}/rabbi/${slugify(a.name)}`,
    `• לוח שיעורים אוטומטי — תלמידים יודעים מתי ואיפה`,
    `• שידור חי + הקלטה אוטומטית (5 ימים)`,
    `• ריכוז פניות מתלמידים במקום אחד`,
    `• עוקבים + התראות אוטומטיות בכל שיעור חדש`,
    "",
    `**העלות: ₪0. לתמיד.**`,
    "",
    a.youtube
      ? `ראיתי את הערוץ שלך ב-YouTube — אפשר גם לחבר אותו אוטומטית, כך שכל שיעור חדש יופיע גם אצלנו בלי עבודה נוספת.`
      : "",
    "",
    `אם הרב מעוניין, אשמח להציע 3 זמנים לשיחת זום של 15 דקות:`,
    `• [זמן 1]`,
    `• [זמן 2]`,
    `• [זמן 3]`,
    "",
    `או פשוט להקים את הדף מראש ולשלוח לראות, בלי מחויבות.`,
    "",
    `בברכה,`,
    FOUNDER_NAME,
    `${SITE}`,
  ].filter(Boolean).join("\n");
}

function buildPhoneScript(a: Args): string {
  return [
    `# תסריט שיחה — ${a.name}`,
    "",
    `## פתיחה (15 שניות)`,
    `"שלום, שמי ${FOUNDER_NAME}. אני מתקשר להציע לכבוד הרב פלטפורמה חדשה בשם TORA_LIVE — בחינם — לריכוז השיעורים שלו במקום אחד. האם זה זמן נוח ל-2 דקות?"`,
    "",
    `## ההסבר (45 שניות)`,
    `"הפלטפורמה מרכזת שיעורי רבנים מהמגזר — דף אישי לכל רב, לוח שיעורים, שידור חי, הקלטות. תלמידים יכולים לעקוב ולקבל התראות. הכל חינם, בלי פרסומות, בלי גוזלים של זכויות יוצרים — הרב בעלי הזכויות."`,
    "",
    `## הבקשה`,
    `"אני רוצה להקים את הדף של הרב בחינם, בלי מחויבות. אני אשלח לינק במייל/וואטסאפ, הרב יראה, ואם מתאים — נמשיך. אם לא — לא קרה כלום. האם זה נשמע הוגן?"`,
    "",
    `## שאלות צפויות`,
    `- "זה עולה כסף?" → לא. חינם לתמיד.`,
    `- "מה עם זכויות יוצרים?" → הרב בעל הזכויות. אנחנו רק מארחים.`,
    `- "מי עוד השתמש?" → [מלא 2-3 שמות]. עדיף לומר "אנחנו בשלב ההתחלה, והרב יהיה אחד המובילים"`,
    `- "אני לא מבין בטכנולוגיה" → "אין בעיה. אני עושה הכל במקומך. אתה רק שולח לי קישורים לשיעורים."`,
    "",
    `## סגירה`,
    `"אשלח עכשיו הודעת וואטסאפ עם לינק לדף הדגמה. אחזור לרב בעוד 3 ימים. תודה רבה על הזמן."`,
  ].join("\n");
}

function buildFollowUps(a: Args): string {
  return [
    `# Follow-ups — ${a.name}`,
    "",
    `## יום 3 (אם אין מענה להודעה ראשונה)`,
    `"שלום הרב, רק מוודא שההודעה הגיעה. בלי לחץ — אם לא מתאים עכשיו, מבין לגמרי. מצרף סרטון קצר של הפלטפורמה: [לינק]"`,
    "",
    `## יום 10 (פנייה אחרונה)`,
    `"שלום הרב, שולח פעם אחרונה. רציתי להראות לך משהו ספציפי: ${a.hook || "[הוסף משהו אישי שמצאת במחקר — שיעור, ציטוט, נושא]"}. אם זה לא הזמן — חן חן, אשמור את הרב לעתיד."`,
    "",
    `## אחרי 10 ימים — לא לשלוח יותר.`,
  ].join("\n");
}

async function main() {
  const args = parseArgs();
  const slug = slugify(args.name);
  const outDir = path.join(process.cwd(), "data", "outreach", slug);
  await fs.mkdir(outDir, { recursive: true });

  const research = {
    rabbi: { name: args.name, yeshiva: args.yeshiva || "לא ידוע", youtube: args.youtube, website: args.website, phone: args.phone, email: args.email },
    personalHook: args.hook || "[צריך מחקר ידני]",
    suggestedSlug: slug,
    recommendation: "GO",
    nextStep: `קרא את messages/whatsapp.txt והעתק לוואטסאפ של הרב. אחרי 3 ימים — follow-up.`,
  };

  await fs.mkdir(path.join(outDir, "messages"), { recursive: true });
  await fs.writeFile(path.join(outDir, "research.json"), JSON.stringify(research, null, 2));
  await fs.writeFile(path.join(outDir, "messages", "whatsapp.txt"), buildWhatsApp(args));
  await fs.writeFile(path.join(outDir, "messages", "email.md"), buildEmail(args));
  await fs.writeFile(path.join(outDir, "messages", "phone-script.md"), buildPhoneScript(args));
  await fs.writeFile(path.join(outDir, "messages", "follow-ups.md"), buildFollowUps(args));
  await fs.writeFile(
    path.join(outDir, "status.json"),
    JSON.stringify({ sent: false, createdAt: new Date().toISOString() }, null, 2),
  );

  console.log(`✅ חבילת outreach ל-${args.name} נוצרה:`);
  console.log(`   ${outDir}`);
  console.log(`\n📂 קבצים:`);
  console.log(`   - research.json`);
  console.log(`   - messages/whatsapp.txt`);
  console.log(`   - messages/email.md`);
  console.log(`   - messages/phone-script.md`);
  console.log(`   - messages/follow-ups.md`);
  console.log(`\n💡 קרא את ההודעה הראשונה, ערוך לטעמך, ושלח.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
