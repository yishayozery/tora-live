import { Card } from "@/components/ui/Card";
import { Accessibility, Mail, Phone } from "lucide-react";

export const metadata = {
  title: "הצהרת נגישות | TORA_LIVE",
  description: "אתר TORA_LIVE מונגש לפי תקן ישראלי 5568 (WCAG 2.1 AA). צרו קשר לדיווח בעיות נגישות.",
};

export const revalidate = 86400; // יומי

export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8 flex items-center gap-3">
        <Accessibility className="w-8 h-8 text-primary" />
        <h1 className="hebrew-serif text-4xl font-bold text-ink">הצהרת נגישות</h1>
      </header>

      <div className="space-y-6">
        <Card>
          <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">מחויבות להנגשה</h2>
          <p className="text-ink-soft leading-relaxed">
            אנחנו ב-TORA_LIVE מחויבים להנגיש את שירותי האתר לכלל הציבור, לרבות אנשים עם מוגבלות,
            בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, ולתקן ישראלי 5568 המבוסס על
            הנחיות WCAG 2.1 רמה AA.
          </p>
        </Card>

        <Card>
          <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">מה נעשה באתר</h2>
          <ul className="space-y-2 text-ink-soft list-disc pr-5">
            <li>כיוון כתיבה עברי (RTL) מובנה בכל האתר</li>
            <li>גדלי טקסט קריאים עם אפשרות הגדלה בדפדפן</li>
            <li>קישורים וכפתורים עם טקסט תיאורי ברור</li>
            <li>תמונות עם תיאור טקסטואלי חלופי (alt)</li>
            <li>ניגודיות גבוהה בין טקסט לרקע (לפחות 4.5:1)</li>
            <li>ניווט מלא באמצעות מקלדת (Tab + Enter)</li>
            <li>הדגשה ויזואלית בעת מיקוד (focus ring)</li>
            <li>דילוג לתוכן הראשי ("דלג לתוכן")</li>
            <li>קוראי מסך (screen readers) נתמכים עם תגיות ARIA</li>
            <li>סרטונים ניתנים להשמעה עם בקרי נגישות של YouTube</li>
            <li>תמיכה במובייל ובכל גדלי מסך</li>
          </ul>
        </Card>

        <Card>
          <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">הגבלות ידועות</h2>
          <p className="text-ink-soft leading-relaxed mb-2">
            חלק מהתכנים באתר הם הטבעות מצד שלישי (YouTube) שנגישותם נקבעת ע"י הספק.
            אנחנו פועלים לוודא שהקישורים עצמם מונגשים לצד תכני הצד השלישי.
          </p>
          <p className="text-ink-soft leading-relaxed">
            שיעורים שאושרו כפרטיים או חסומים יוצגו עם הודעה מתאימה.
          </p>
        </Card>

        <Card>
          <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">דרכי יצירת קשר — רכז נגישות</h2>
          <p className="text-ink-soft leading-relaxed mb-4">
            נתקלת בבעיית נגישות? זיהית תוכן שלא מונגש? נשמח לעזור לתקן:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-soft">
              <Mail className="w-4 h-4 text-primary" />
              <a href="mailto:accessibility@tora-live.co.il" className="hover:text-primary transition" dir="ltr">
                accessibility@tora-live.co.il
              </a>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <Phone className="w-4 h-4 text-primary" />
              <span>דרך עמוד <a href="/contact" className="text-primary hover:underline">יצירת קשר</a></span>
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-4">
            אנחנו מתחייבים להגיב לפניות נגישות בתוך 5 ימי עסקים.
          </p>
        </Card>

        <Card>
          <h2 className="hebrew-serif text-xl font-bold text-ink mb-3">עדכון ההצהרה</h2>
          <p className="text-ink-soft leading-relaxed">
            הצהרה זו עודכנה לאחרונה בתאריך <strong>ט"ז בניסן תשפ"ו</strong> (20/04/2026).
          </p>
          <p className="text-ink-soft leading-relaxed mt-2">
            ההצהרה מתעדכנת תקופתית לאור שיפורי נגישות שאנחנו מבצעים באתר ובהתאם לשינויים בתקנים.
          </p>
        </Card>

        <Card className="bg-primary-soft border-primary/30">
          <h2 className="hebrew-serif text-lg font-bold text-ink mb-2">חשוב לנו שתדע</h2>
          <p className="text-ink-soft text-sm leading-relaxed">
            האתר בנוי על התפיסה שהנגישות אינה רק חובה חוקית — היא חלק מכבוד האדם. אם משהו לא עובד לך,
            לא משנה הסיבה, פנה אלינו ונעזור.
          </p>
        </Card>
      </div>
    </div>
  );
}
