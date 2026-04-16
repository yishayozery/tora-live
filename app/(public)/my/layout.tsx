import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { User, Calendar, Heart, MessageSquare, HandHeart } from "lucide-react";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!student) redirect("/");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* כותרת אישית */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center hebrew-serif text-2xl text-primary">
          {student.name.charAt(0)}
        </div>
        <div>
          <h1 className="hebrew-serif text-2xl font-bold text-ink">שלום, {student.name}</h1>
          <p className="text-sm text-ink-muted">{student.user.email}</p>
        </div>
      </div>

      {/* ניווט — 5 טאבים */}
      <nav className="flex flex-wrap gap-1 border-b border-border mb-6 text-sm -mx-1">
        <Tab href="/my/schedule" icon={Calendar}>הלוח שלי</Tab>
        <Tab href="/my/rabbis" icon={Heart}>רבנים</Tab>
        <Tab href="/my/requests" icon={MessageSquare}>פניות</Tab>
        <Tab href="/my/profile" icon={User}>פרופיל</Tab>
        <Tab href="/my/donations" icon={HandHeart}>תרומות</Tab>
      </nav>

      {children}
    </div>
  );
}

function Tab({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 text-ink-soft hover:text-ink border-b-2 border-transparent hover:border-primary transition"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
}
