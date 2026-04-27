import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { MessageCircle, UserPlus, LogIn } from "lucide-react";
import { AskRabbiSearch } from "@/components/AskRabbiSearch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "פנייה לרב — TORA_LIVE",
  description: "שלח בקשה לרב לקבלת שיעור או ייעוץ אישי. דורש הרשמה כתלמיד.",
};

export default async function AskRabbiPage() {
  const session = await getServerSession(authOptions);

  // אם לא מחובר — דף נחיתה עם login wall
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink mb-3">
            פנייה לרב
          </h1>
          <p className="text-ink-soft text-base sm:text-lg">
            שלח בקשה לרב — לשיעור פרטי, יום עיון, או שאלה אישית.
          </p>
        </div>

        <Card className="border-primary/30">
          <div className="text-center py-6">
            <h2 className="hebrew-serif text-xl font-bold text-ink mb-2">
              נדרשת הרשמה
            </h2>
            <p className="text-sm text-ink-soft mb-6 max-w-md mx-auto">
              כדי לפנות לרב צריך חשבון תלמיד. ההרשמה חינמית, לוקחת דקה,
              ומאפשרת לך גם לעקוב אחרי רבנים, לקבל התראות על שיעורים חדשים,
              ולסמן שיעורים ללוח האישי.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register?next=/ask-rabbi"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition shadow-soft"
              >
                <UserPlus className="w-4 h-4" />
                הירשם חינם
              </Link>
              <Link
                href="/login?next=/ask-rabbi"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-btn border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition"
              >
                <LogIn className="w-4 h-4" />
                כבר רשום? התחבר
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/rabbis" className="text-sm text-primary hover:underline">
            ← חזרה לרשימת הרבנים
          </Link>
        </div>
      </div>
    );
  }

  // מחובר — בדוק שזה תלמיד (לא רב/אדמין)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, student: { select: { isBlocked: true } } },
  });
  if (!user || user.role !== "STUDENT" || !user.student) {
    redirect("/");
  }
  if (user.student.isBlocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-center text-ink py-6">
            חשבונך חסום מפנייה לרבנים. פנה אלינו אם זו טעות.
          </p>
        </Card>
      </div>
    );
  }

  // טעינת רבנים — עם פרטים מזהים נוספים למניעת בלבול
  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photoUrl: true,
      _count: { select: { followers: true, lessons: true } },
    },
    orderBy: [{ name: "asc" }],
  });

  // קח גם איזה רבנים המשתמש עוקב — להציג קודם
  const studentId = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  }).then((s) => s?.id);

  let followedIds: Set<string> = new Set();
  if (studentId) {
    const follows = await db.follow.findMany({
      where: { studentId },
      select: { rabbiId: true },
    });
    followedIds = new Set(follows.map((f) => f.rabbiId));
  }

  const enrichedRabbis = rabbis.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    photoUrl: r.photoUrl,
    bioFirstLine: (r.bio ?? "").split(/\n|\./).find((s) => s.trim().length > 5)?.trim().slice(0, 80) ?? "",
    lessonsCount: r._count.lessons,
    followersCount: r._count.followers,
    isFollowing: followedIds.has(r.id),
  }));

  // מיון: עוקבים קודם, אחרי זה לפי alphabet
  enrichedRabbis.sort((a, b) => {
    if (a.isFollowing && !b.isFollowing) return -1;
    if (!a.isFollowing && b.isFollowing) return 1;
    return a.name.localeCompare(b.name, "he");
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="hebrew-serif text-3xl sm:text-4xl font-bold text-ink flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          פנייה לרב
        </h1>
        <p className="text-ink-soft mt-2">
          בחר את הרב שאליו ברצונך לפנות. תוכל לבקש שיעור, יום עיון, או לשאול שאלה אישית.
        </p>
        <p className="text-xs text-ink-muted mt-1">
          💡 שים לב: לעיתים יש מספר רבנים בשם דומה. בדוק את התמונה והתיאור לפני שליחה.
        </p>
      </header>

      <AskRabbiSearch rabbis={enrichedRabbis} />
    </div>
  );
}
