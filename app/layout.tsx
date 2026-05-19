import type { Metadata, Viewport } from "next";
import { Heebo, Noto_Serif_Hebrew, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

// Body font — Heebo (cleaner on mobile, wider counters than Assistant)
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Title font — Noto Serif Hebrew (richer presence at large sizes, great for hero)
const notoSerif = Noto_Serif_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-noto-serif-hebrew",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// Hero/display font — Frank Ruhl Libre. הפונט שמוצהר ב-CLAUDE.md ככותרת
// "המוסמכת" של הפרויקט — אלגנטי, רגיל בעיתון הארץ ובסידורים מודרניים.
const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-frank-ruhl",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// viewport-fit=cover מאפשר שימוש ב-env(safe-area-inset-*) ב-iPhones עם notch / home-indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E40AF",
};

export const metadata: Metadata = {
  title: "TORA_LIVE — שיעורי תורה אונליין בשידור חי",
  description:
    "שיעורי תורה אונליין בשידור חי — מאות רבנים מהמגזר הדתי-לאומי. האזינו לשיעורים, פרשת שבוע, דף יומי והלכה יומית. חינם, ללא הרשמה.",
  keywords: [
    "שיעורי תורה אונליין",
    "שידור חי",
    "פרשת שבוע",
    "דף יומי",
    "הלכה יומית",
    "שיעור תורה",
    "רבנים",
    "דתי לאומי",
    "חרדל\"י",
    "תורה לייב",
  ],
  metadataBase: new URL("https://tora-live.co.il"),
  alternates: {
    canonical: "https://tora-live.co.il/",
    languages: {
      "he-IL": "https://tora-live.co.il/",
      "en-US": "https://tora-live.co.il/en",
    },
  },
  openGraph: {
    title: "TORA_LIVE",
    description: "שיעורי תורה אונליין — הבית הדיגיטלי של הרבנים.",
    locale: "he_IL",
    alternateLocale: ["en_US"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${notoSerif.variable} ${frankRuhl.variable} scroll-smooth`}>
      <body className="font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-btn focus:shadow-soft"
        >
          דלג לתוכן הראשי
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
