import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { RabbisClient } from "@/components/RabbisExplorer";

type RabbiCard = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  lessonsCount: number;
  followersCount: number;
  upcomingCount: number;
  hasLive: boolean;
  isFollowing: boolean;
  categories: string[];
  broadcastTypes: string[]; // ["LESSON", "PRAYER", "OTHER"] — סוגים שהרב מעביר בפועל
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

  const now = new Date();
  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    include: {
      _count: { select: { followers: true, lessons: true } },
      categories: { select: { name: true } },
      lessons: {
        where: {
          isPublic: true,
          approvalStatus: "APPROVED",
          isSuspended: false,
        },
        select: {
          id: true,
          scheduledAt: true,
          isLive: true,
          broadcastType: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const rabbiCards: RabbiCard[] = rabbis.map((r) => {
    const types = new Set(r.lessons.map((l) => l.broadcastType));
    const upcoming = r.lessons.filter((l) => l.scheduledAt >= now).length;
    const live = r.lessons.some((l) => l.isLive);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      bio: r.bio,
      photoUrl: r.photoUrl,
      lessonsCount: r._count.lessons,
      followersCount: r._count.followers,
      upcomingCount: upcoming,
      hasLive: live,
      isFollowing: followedIds.has(r.id),
      categories: r.categories.map((c) => c.name),
      broadcastTypes: Array.from(types),
    };
  });

  const allCategories = Array.from(
    new Set(rabbiCards.flatMap((r) => r.categories))
  ).sort();

  return <RabbisClient rabbis={rabbiCards} categories={allCategories} />;
}
