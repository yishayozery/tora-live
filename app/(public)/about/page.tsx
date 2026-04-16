import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { BookOpen, Users, Radio, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "אודות — TORA_LIVE",
  description: "על פלטפורמת TORA_LIVE — הבית הדיגיטלי של רבני ישראל.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink text-center">אודות TORA_LIVE</h1>
      <p className="text-lg text-ink-soft text-center mt-4 max-w-2xl mx-auto">
        הבית הדיגיטלי של רבני ישראל — פלטפורמה שמנגישה אלפי שיעורי תורה, תפילות ואירועים לציבור הרחב, בחינם וללא הרשמה.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 mt-10">
        {[
          { icon: BookOpen, title: "שיעורים וארכיון", desc: "שיעורים חיים ומוקלטים בכל נושא — מדף יומי ועד מחשבת ישראל. כולם זמינים מיד, ללא הרשמה." },
          { icon: Radio, title: "שידורים חיים", desc: "הרבנים משדרים ישירות מהערוץ שלהם או דרך הפלטפורמה. צ׳אט שאלות בצד, דף מקורות מסונכרן." },
          { icon: Users, title: "קהילת תלמידים", desc: "תלמידים עוקבים אחרי רבנים, מקבלים תזכורות, שואלים שאלות ובונים לוח לימוד אישי." },
          { icon: Heart, title: "הקדשת שיעורים", desc: "אפשר להקדיש את שיעורי היום לזכר או לזכות יקיריכם. קבלה נשלחת אוטומטית." },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-ink">{title}</h2>
                <p className="text-sm text-ink-muted mt-1">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-10 text-center">
        <p className="text-ink-soft">
          TORA_LIVE נבנתה מתוך אהבת התורה ורצון להנגיש את לימוד התורה לכל אדם, בכל מקום.
          <br />
          לשאלות והצעות — <a href="/contact" className="text-primary">צור קשר</a>.
        </p>
      </Card>
    </div>
  );
}
