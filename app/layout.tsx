import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-frank-ruhl",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TORA_LIVE — פלטפורמת שיעורי תורה אונליין",
  description:
    "הבית הדיגיטלי של רבני ישראל — שיעורים, שידורים חיים, לוח שנה ותקשורת עם תלמידים במקום אחד.",
  metadataBase: new URL("https://tora-live.co.il"),
  openGraph: {
    title: "TORA_LIVE",
    description: "שיעורי תורה אונליין — הבית הדיגיטלי של הרבנים.",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${frankRuhl.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
