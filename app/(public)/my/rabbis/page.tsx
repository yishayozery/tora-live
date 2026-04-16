import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { RabbisClient } from "@/components/RabbisExplorer";

type RabbiCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  lessonsCount: number;
  followersCount: number;
  isFollowing: boolean;
  categories: string[];
};

export default async function RabbisPage() {
  const session = await requireSession();
  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return null;

  const followedIds = new Set(
    (await db.follow.findMany({
      where: { studentId: student.id },
      select: { rabbiId: true },
    })).map((f) => f.rabbiId)
  );

  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    include: {
      _count: { select: { followers: true, lessons: true } },
      categories: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const rabbiCards: RabbiCard[] = rabbis.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    bio: r.bio,
    lessonsCount: r._count.lessons,
    followersCount: r._count.followers,
    isFollowing: followedIds.has(r.id),
    categories: r.categories.map((c) => c.name),
  }));

  // חלץ את כל הקטגוריות הייחודיות
  const allCategories = Array.from(
    new Set(rabbiCards.flatMap((r) => r.categories))
  ).sort();

  return <RabbisClient rabbis={rabbiCards} categories={allCategories} />;
}
