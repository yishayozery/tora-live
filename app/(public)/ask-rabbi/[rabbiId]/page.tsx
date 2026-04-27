import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowRight, MessageCircle } from "lucide-react";
import { AskRabbiForm } from "@/components/AskRabbiForm";

export const dynamic = "force-dynamic";

export default async function AskRabbiFormPage({ params }: { params: { rabbiId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?next=/ask-rabbi/${params.rabbiId}`);

  const rabbi = await db.rabbi.findUnique({
    where: { id: params.rabbiId },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photoUrl: true,
      status: true,
      isBlocked: true,
    },
  });
  if (!rabbi || rabbi.status !== "APPROVED" || rabbi.isBlocked) notFound();

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!student) redirect("/register?next=/ask-rabbi/" + params.rabbiId);
  if (student.isBlocked) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-danger">חשבונך חסום מפנייה לרבנים.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/ask-rabbi"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
      >
        <ArrowRight className="w-3.5 h-3.5" /> חזרה לרשימת הרבנים
      </Link>

      {/* כרטיס הרב — אישור שלא טעית בבחירה */}
      <div className="bg-white border-2 border-primary/30 rounded-card p-4 mb-6">
        <div className="flex items-center gap-4">
          {rabbi.photoUrl ? (
            rabbi.photoUrl.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rabbi.photoUrl} alt={rabbi.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-gold-soft shrink-0" />
            ) : (
              <Image src={rabbi.photoUrl} alt={rabbi.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-2 ring-gold-soft shrink-0" />
            )
          ) : (
            <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-gold-soft to-gold/30 flex items-center justify-center hebrew-serif font-bold text-2xl text-gold ring-2 ring-gold-soft">
              {rabbi.name.replace("הרב ", "").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-muted">פנייה אל</div>
            <h1 className="hebrew-serif text-2xl font-bold text-ink">{rabbi.name}</h1>
            {rabbi.bio && (
              <p className="text-xs text-ink-soft line-clamp-2 mt-1">
                {rabbi.bio.split(/\n|\./).find((s) => s.trim().length > 5)?.trim().slice(0, 100)}
              </p>
            )}
            <Link
              href={`/rabbi/${rabbi.slug}`}
              target="_blank"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              לדף הרב →
            </Link>
          </div>
        </div>
      </div>

      <h2 className="hebrew-serif text-xl font-bold text-ink mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        תוכן הפנייה
      </h2>

      <AskRabbiForm
        rabbiId={rabbi.id}
        rabbiName={rabbi.name}
        userInfo={{
          name: student.name,
          email: student.user?.email ?? undefined,
          phone: student.phoneE164 ?? undefined,
        }}
      />
    </div>
  );
}
