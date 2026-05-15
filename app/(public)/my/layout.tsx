import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!student) redirect("/");

  // הניווט בין הדפים האישיים נמצא בתפריט המשתמש שב-SiteHeader (אווטר עליון בצד).
  // אין כאן שורת תפריט נוספת — כדי שלא יהיו 2 נווטים על אותו דף.
  return <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">{children}</div>;
}
