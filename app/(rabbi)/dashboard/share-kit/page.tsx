import Image from "next/image";
import Link from "next/link";
import { requireApprovedRabbi } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  ShareKitCopyBlocks,
  ShareKitActions,
  DownloadImageButton,
} from "@/components/rabbi/ShareKitClient";
import { Share2, Sparkles, Eye, QrCode } from "lucide-react";

const SITE = "https://tora-live.co.il";

export const metadata = {
  title: "ערכת שיתוף — TANA",
  description: "ערכת שיתוף מוכנה לרבנים — הודעות, קישורים ו-QR להפצת הדף שלך.",
};

export default async function ShareKitPage() {
  const { rabbi } = await requireApprovedRabbi();

  const [lessonsCount, followersCount] = await Promise.all([
    db.lesson.count({ where: { rabbiId: rabbi.id } }),
    db.follow.count({ where: { rabbiId: rabbi.id } }),
  ]);

  const url = `${SITE}/rabbi/${rabbi.slug}`;
  const shortUrl = `tora-live.co.il/rabbi/${rabbi.slug}`;

  const whatsappText = `שלום! פתחתי דף ב-TANA — פלטפורמת שיעורי תורה.
כל השיעורים שלי במקום אחד, עם לוח שבועי + שידור חי + ארכיון.
לכתובת שלי: ${shortUrl}
נשמח שתעקבו ותפיצו 🙏`;

  const emailSubject = `הדף החדש שלי ב-TANA — ${rabbi.name}`;
  const emailBody = `שלום וברכה,

שמח לבשר שפתחתי דף חדש בפלטפורמת TANA — מקום אחד שמרכז את כל השיעורים שלי:
לוח שבועי של שיעורים, שידור חי בזמן אמת, וארכיון מסודר לצפייה חוזרת.

הקישור לדף שלי:
${url}

אשמח אם תיכנסו, תעקבו, ותפיצו הלאה למי שעשוי להתעניין.
זו הזדמנות נהדרת להגיע ליותר אנשים שצריכים את התורה שלנו.

בברכת התורה,
${rabbi.name}`;

  const tagline = `השיעורים שלי ב-TANA → ${shortUrl}`;

  // OG image — ננסה את ה-route ה-API אם קיים, אחרת fallback לתמונת הרב.
  const ogImage = rabbi.photoUrl || null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <header>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-soft px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          השיתוף שלך
        </span>
        <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold mt-3 leading-tight">
          הפץ את הדף שלך — תוך 30 שניות
        </h1>
        <p className="text-ink-soft mt-2 max-w-2xl">
          הכל מוכן מראש. העתק והדבק ב-WhatsApp, שלח במייל, או שתף ברשתות.
        </p>
      </header>

      {/* Profile preview */}
      <Card className="flex items-center gap-4 sm:gap-5 border-primary/20 bg-gradient-to-l from-primary-soft/40 via-white to-white">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-paper-soft border border-border shrink-0 relative">
          {rabbi.photoUrl ? (
            <Image
              src={rabbi.photoUrl}
              alt={rabbi.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted hebrew-serif text-2xl">
              {rabbi.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="hebrew-serif text-xl sm:text-2xl font-bold truncate">{rabbi.name}</div>
          <Link
            href={`/rabbi/${rabbi.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline break-all inline-flex items-center gap-1"
          >
            {shortUrl}
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <div className="text-xs text-ink-muted mt-1.5">
            {lessonsCount.toLocaleString("he-IL")} שיעורים · {followersCount.toLocaleString("he-IL")} עוקבים
          </div>
        </div>
      </Card>

      {/* Direct share buttons */}
      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-3 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-primary" /> שיתוף מהיר
        </h2>
        <ShareKitActions
          url={url}
          whatsappText={whatsappText}
          emailSubject={emailSubject}
          emailBody={emailBody}
          tagline={tagline}
        />
      </section>

      {/* Ready-to-share copy blocks */}
      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-3">הודעות מוכנות להעתקה</h2>
        <ShareKitCopyBlocks
          whatsappText={whatsappText}
          emailSubject={emailSubject}
          emailBody={emailBody}
          tagline={tagline}
        />
      </section>

      {/* QR + Preview */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            קוד QR לדף שלך
          </CardTitle>
          <CardDescription className="mb-4">
            הדפס על מודעה בבית הכנסת, או הצג בסוף שיעור — קל וזריז לסריקה.
          </CardDescription>
          <div className="flex items-center justify-center bg-white border border-border rounded-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                url
              )}&color=1E40AF&bgcolor=ffffff`}
              alt={`QR לדף של ${rabbi.name}`}
              width={240}
              height={240}
              className="block"
            />
          </div>
          <div className="mt-3 text-center">
            <DownloadImageButton
              src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                url
              )}&color=1E40AF&bgcolor=ffffff`}
              filename={`qr-${rabbi.slug}.png`}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>תצוגה מקדימה ברשתות</CardTitle>
          <CardDescription className="mb-4">
            כך הדף שלך ייראה כשמישהו ישתף אותו ב-WhatsApp / Facebook / Twitter.
          </CardDescription>
          <div className="rounded-card overflow-hidden border border-border bg-paper-soft">
            <div className="aspect-[1200/630] bg-gradient-to-br from-primary to-primary-hover relative">
              {ogImage ? (
                <Image
                  src={ogImage}
                  alt={`תצוגה מקדימה — ${rabbi.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover opacity-90"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                <div className="hebrew-serif text-xl sm:text-2xl font-bold">{rabbi.name}</div>
                <div className="text-xs sm:text-sm opacity-90 mt-0.5">{shortUrl}</div>
              </div>
            </div>
            <div className="p-3 text-xs text-ink-muted bg-white border-t border-border">
              <div className="font-medium text-ink truncate">{rabbi.name} — TANA</div>
              <div className="truncate">{shortUrl}</div>
            </div>
          </div>
          {ogImage && (
            <div className="mt-3 text-center">
              <DownloadImageButton src={ogImage} filename={`${rabbi.slug}-cover.jpg`} />
            </div>
          )}
        </Card>
      </section>

      {/* Tips */}
      <section>
        <h2 className="hebrew-serif text-2xl font-bold mb-3">טיפים לשיתוף יעיל</h2>
        <div className="space-y-2">
          <details className="rounded-card border border-border bg-white p-4 group">
            <summary className="cursor-pointer font-semibold text-ink list-none flex items-center justify-between">
              <span>מתי הכי טוב לשתף?</span>
              <span className="text-primary text-sm group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="text-sm text-ink-soft mt-3 leading-relaxed">
              לפני שיעור (תזכורת ללוח השבועי), מיד אחרי שיעור משמעותי (כשהקהל בשיא העניין),
              ולקראת חגים ומועדים — אז אנשים מחפשים תוכן רוחני.
            </p>
          </details>
          <details className="rounded-card border border-border bg-white p-4 group">
            <summary className="cursor-pointer font-semibold text-ink list-none flex items-center justify-between">
              <span>מי כדאי להוסיף לרשימת התפוצה?</span>
              <span className="text-primary text-sm group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="text-sm text-ink-soft mt-3 leading-relaxed">
              תלמידים מקבוצות לימוד קודמות, בני קהילה ומתפללים, חברים ומכרים שעשויים להתעניין,
              וקבוצות WhatsApp של בית הכנסת או השכונה. אל תפחד לבקש מתלמידים ותיקים להפיץ הלאה.
            </p>
          </details>
          <details className="rounded-card border border-border bg-white p-4 group">
            <summary className="cursor-pointer font-semibold text-ink list-none flex items-center justify-between">
              <span>מה לעשות אם אין תגובה?</span>
              <span className="text-primary text-sm group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="text-sm text-ink-soft mt-3 leading-relaxed">
              שלח תזכורת חיה רגע לפני השיעור הבא (פעולה אקטיבית עדיפה על הודעה סטטית), צרף ציטוט קצר
              מהשיעור או נושא מעניין שמתוכנן, ובקש פידבק אישי ממי שכבר נכנס — זה מייצר מעורבות.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
