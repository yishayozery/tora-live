/**
 * מזין את רשימת המועמדים ל-SourceCandidate (לממשק האדמין).
 * מריצים פעם אחת — אחרי זה האדמין מנהל את הרשימה דרך ה-UI.
 *
 * Usage:
 *   tsx scripts/seed-candidates.ts         # יוצר (מדלג על כאלה שכבר קיימים)
 *   tsx scripts/seed-candidates.ts --reset # מוחק ויוצר מחדש
 */
import { db } from "@/lib/db";

type Candidate = {
  name: string;
  handle?: string;
  channelUrl?: string;
  facebookUrl?: string;
  category: "yeshiva" | "rabbi" | "midrasha" | "org" | "facebook_only";
  priority: 1 | 2 | 3;
  content?: string;
  concerns?: string;
  recommendedStatus: "approve_trusted" | "approve_pending" | "verify" | "reject";
};

const CANDIDATES: Candidate[] = [
  // ==== ישיבות גבוהות + הסדר ====
  { name: "ישיבת עתניאל (הר חברון)", handle: "youtube.com/user/mediaotniel", facebookUrl: "facebook.com/yeshivatotniel", category: "yeshiva", priority: 1, content: "שיעורי הרב רא\"ם הכהן, הרב בני קלמנזון. פעיל.", recommendedStatus: "approve_pending" },
  { name: "ישיבת ברכת משה — מעלה אדומים", handle: "channel/UCS6OvEopzPGEEwYbAG4ismA", category: "yeshiva", priority: 1, content: "הרב חיים סבתו, הרב נחום רבינוביץ (ארכיון).", recommendedStatus: "approve_pending" },
  { name: "ישיבת שבי חברון", handle: "channel/UC1UJunP8IpS4xfCRtB2HrPQ", facebookUrl: "facebook.com/shaveihevron.org", category: "yeshiva", priority: 1, content: "שיעורי ראש ישיבה + רבנים; לוח שידורים שבועי.", recommendedStatus: "approve_pending" },
  { name: "ישיבת תקוע", handle: "channel/UC9BghXtEwsqvlbtqChESYkQ", category: "yeshiva", priority: 1, content: "הרב משנכ\"ל שטיינזלץ — דף יומי יומי. ספוטיפיי פעיל.", recommendedStatus: "approve_pending" },
  { name: "ישיבת ההסדר ירוחם", handle: "channel/UCgckxe8KqcRB3RY8Kp6n3Yw", category: "yeshiva", priority: 1, content: "הרב בלומנצוויג + סגל.", recommendedStatus: "approve_pending" },
  { name: "ישיבת ההסדר קרני שומרון", handle: "@YeshivatKarnash", category: "yeshiva", priority: 1, content: "שיעורים שוטפים.", recommendedStatus: "approve_pending" },
  { name: "ישיבת ברכת יוסף אלון מורה", handle: "channel/UCKP0R5jglggmjOipzviXdHw", category: "yeshiva", priority: 1, content: "הרב אליקים לבנון (ראש ישיבה).", recommendedStatus: "approve_pending" },
  { name: "ישיבת הכותל", handle: "@YeshivatHakotel", category: "yeshiva", priority: 1, content: "עיר העתיקה; שידורים חיים.", recommendedStatus: "approve_trusted" },
  { name: "ישיבת מעלה גלבוע", handle: "@ShiluvMaagal", facebookUrl: "facebook.com/MaaleGilboaYeshiva", category: "yeshiva", priority: 2, content: "זרם פתוח/שילוב.", recommendedStatus: "approve_pending" },
  { name: "ישיבת אורות יעקב — רחובות", handle: "channel/UC3-Oo5XiJnAao6aV_UbsZEQ", category: "yeshiva", priority: 2, content: "אמונה, הלכה, גמרא.", recommendedStatus: "approve_pending" },
  { name: "ישיבת אורות שאול — תל אביב", handle: "channel/UC0SUhqlVul9GOeQeMuSDtwg", category: "yeshiva", priority: 2, content: "הרב יובל שרלו — שונה מאורות שאול הגולן.", concerns: "ייתכן כפילות — לאמת", recommendedStatus: "verify" },
  { name: "ישיבת בית אל", handle: "channel/UCbo8mGyJcI6y9X8QqLUExxg", category: "yeshiva", priority: 1, content: "הרב זלמן ברוך מלמד (ראש ישיבה).", recommendedStatus: "approve_trusted" },
  { name: "ישיבה תיכונית נתיבות יוסף (מצפה יריחו)", handle: "channel/UCcAWFlrKKuP8TQdWbEqe_9g", category: "yeshiva", priority: 3, content: "תיכונית; פחות רלוונטי לקהל בוגר.", recommendedStatus: "approve_pending" },
  { name: "ישיבת מצפה יריחו (גבוהה)", handle: "channel/UCx_LYiJ4swHk2Hxvg0yXckw", category: "yeshiva", priority: 2, content: "הרב זלמן נחמיה גולדברג זצ\"ל (ארכיון) + סגל.", recommendedStatus: "approve_pending" },
  { name: "ישיבת ההסדר ראשון לציון", handle: "youtube.com/user/HasderReshonLeZion", category: "yeshiva", priority: 2, content: "הרב שלמה לוי; בית מדרש מרחבים.", recommendedStatus: "approve_pending" },
  { name: "ישיבת הסדר חולון", handle: "@HolonYeshiva", category: "yeshiva", priority: 2, content: "הרב חגי לונדין + הרב טל שאוליאן.", recommendedStatus: "approve_pending" },
  { name: "ישיבת הגולן (חיספין)", category: "yeshiva", priority: 3, content: "הסדר ותיק. שיעורים ב-ygolan.org — לא ברור אם ב-YouTube.", concerns: "אין ערוץ מזוהה", recommendedStatus: "verify" },
  { name: "ישיבת אור עציון", facebookUrl: "facebook.com/oretzion", category: "yeshiva", priority: 3, content: "הרב חיים דרוקמן זצ\"ל (ארכיון).", concerns: "אין ערוץ YouTube פעיל", recommendedStatus: "verify" },
  { name: "ישיבת נוה דקלים (אשדוד)", category: "yeshiva", priority: 3, content: "הרב דוד גבריאלי.", concerns: "אין ערוץ מזוהה", recommendedStatus: "verify" },
  { name: "תורה בישראל — היכל אליהו כוכב יעקב", handle: "channel/UCclRxcZ3SP4SIPn2MaYg-ZQ", category: "yeshiva", priority: 3, content: "שיעורי קהילה.", recommendedStatus: "verify" },

  // ==== רבנים אישיים ====
  { name: "הרב דב ליאור", handle: "@HaravDovLior", facebookUrl: "facebook.com/Rav.Dov.Lior", category: "rabbi", priority: 2, content: "רב קריית ארבע לשעבר.", concerns: "קשור למפלגת עוצמה יהודית — ייתכן תוכן פוליטי", recommendedStatus: "verify" },
  { name: "הרב יגאל לוינשטיין (בני דוד עלי)", handle: "channel/UCdHjt2ox7DrxuwkrKRBDsTA", category: "rabbi", priority: 2, content: "ערוץ \"בואי הרוח\".", concerns: "שנוי במחלוקת (אמירות על להט\"ב ועל חיילות)", recommendedStatus: "verify" },
  { name: "הרב יוסף צבי רימון", handle: "channel/UCPn5r3-8YV3-5YYGiQin1tA", facebookUrl: "facebook.com/haravrimon", category: "rabbi", priority: 1, content: "הלכה יומית, מרכז הלכה והוראה, סולמות. איכותי מאוד.", recommendedStatus: "approve_trusted" },
  { name: "הרב שמואל טל — תורת החיים (יד בנימין)", category: "rabbi", priority: 2, content: "torath.org.il + talchaim.org.il", concerns: "גוון חרד\"לי", recommendedStatus: "verify" },
  { name: "הרב אליקים לבנון", category: "rabbi", priority: 2, content: "דרך אלון מורה + meirtv", recommendedStatus: "verify" },
  { name: "הרב דודי דודקביץ' (יצהר)", category: "rabbi", priority: 3, content: "סרטונים ב-YouTube", concerns: "שנוי במחלוקת (אירועי תג מחיר); לא מומלץ", recommendedStatus: "reject" },
  { name: "הרב חיים דרוקמן זצ\"ל", category: "rabbi", priority: 3, content: "ארכיון באור עציון + yeshiva.org.il", concerns: "ארכיון בלבד — נפטר 2022", recommendedStatus: "verify" },
  { name: "הרב אדין שטיינזלץ זצ\"ל", category: "rabbi", priority: 3, content: "Steinsaltz Center + @makorchaim", concerns: "ארכיון; חלקית חב\"ד", recommendedStatus: "approve_pending" },

  // ==== מדרשות נשים ====
  { name: "מדרשת לינדנבאום (אור תורה סטון)", handle: "@מדרשתלינדנבאום-לימודתורהלנשים", category: "midrasha", priority: 1, content: "לימוד תורה מתקדם לנשים, רבני OTS.", recommendedStatus: "approve_trusted" },
  { name: "מדרשת מגדל עוז", handle: "channel/UCDWOUPJPKbJv_Le4vpKEvOQ", category: "midrasha", priority: 1, content: "שיחות + שירים; מסגרת שנה בארץ.", recommendedStatus: "approve_trusted" },
  { name: "מדרשת עין הנצי\"ב (קיבוץ הדתי)", handle: "channel/UCbhVrNF7wv4A7Zegdl7Pelw", facebookUrl: "facebook.com/midrasha", category: "midrasha", priority: 2, content: "שירות לאומי + תורה, מורות הלכה.", recommendedStatus: "approve_pending" },
  { name: "מדרשת שירת הלב", category: "midrasha", priority: 3, content: "לא מצאנו ערוץ רשמי", concerns: "אימות ידני נדרש", recommendedStatus: "verify" },

  // ==== ארגונים ומכונים ====
  { name: "ערוץ מאיר (הרחבה)", handle: "@Meir4All", category: "org", priority: 1, content: "ערוץ ראשי של מכון מאיר (שונה מ-@machonmeir?).", concerns: "לבדוק כפילות עם @machonmeir הקיים", recommendedStatus: "verify" },
  { name: "ערוץ מאיר לילדים", handle: "@meirshows", category: "org", priority: 3, content: "תוכן לילדים/משפחות.", recommendedStatus: "approve_pending" },
  { name: "בית הרב קוק (ירושלים)", handle: "channel/UCEDmZLfF349ToEwytrGywsw", facebookUrl: "facebook.com/JerusalemBeitHaravKook", category: "org", priority: 2, content: "אזכרות, מדרשים על כתבי הראי\"ה.", recommendedStatus: "approve_pending" },
  { name: "מכון התורה והארץ", handle: "@HTORA", category: "org", priority: 2, content: "הלכות התלויות בארץ, שמיטה, ערלה. איכותי.", recommendedStatus: "approve_trusted" },
  { name: "סרוגים — חדשות המגזר", handle: "@SrugimNews", category: "org", priority: 3, content: "חדשות + ראיונות.", concerns: "לא שיעורי תורה ישירים", recommendedStatus: "approve_pending" },
  { name: "Steinsaltz Center", category: "org", priority: 3, content: "steinsaltz-center.org — ארכיון הרב שטיינזלץ", concerns: "לאמת ערוץ YouTube", recommendedStatus: "verify" },

  // ==== Facebook בלבד ====
  { name: "ישיבת דימונה", facebookUrl: "facebook.com/ydimonaz", category: "facebook_only", priority: 3, content: "לא נמצא ערוץ YouTube.", recommendedStatus: "verify" },
];

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    const del = await db.sourceCandidate.deleteMany({ where: { reviewStatus: "PENDING" } });
    console.log(`🗑️  Deleted ${del.count} PENDING candidates`);
  }

  let created = 0, skipped = 0;
  for (const c of CANDIDATES) {
    const existing = await db.sourceCandidate.findFirst({ where: { name: c.name } });
    if (existing) { skipped++; continue; }
    await db.sourceCandidate.create({
      data: {
        name: c.name,
        handle: c.handle ?? null,
        channelUrl: c.channelUrl ?? null,
        facebookUrl: c.facebookUrl ?? null,
        category: c.category,
        priority: c.priority,
        content: c.content ?? null,
        concerns: c.concerns ?? null,
        recommendedStatus: c.recommendedStatus,
        reviewStatus: "PENDING",
      },
    });
    created++;
  }
  console.log(`\n✅ Created ${created} candidates, skipped ${skipped} existing.`);
  console.log(`\n👀 Review them at: /admin/sources/candidates`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("💥", e); process.exit(1); });
