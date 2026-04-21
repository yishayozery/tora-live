import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=...&limit=8
 * Returns: { rabbis: [...], lessons: [...], topics: [...] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "8", 10), 20);

  if (q.length < 2) {
    return NextResponse.json({ rabbis: [], lessons: [], topics: [] });
  }

  // Run 3 queries in parallel
  const [rabbis, lessons, categories] = await Promise.all([
    db.rabbi.findMany({
      where: {
        status: "APPROVED",
        isBlocked: false,
        OR: [{ name: { contains: q } }, { bio: { contains: q } }],
      },
      select: { name: true, slug: true, photoUrl: true, _count: { select: { lessons: true } } },
      take: 4,
    }),
    db.lesson.findMany({
      where: {
        approvalStatus: "APPROVED",
        isPublic: true,
        isSuspended: false,
        AND: [
          {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { organizerName: { contains: q } },
            ],
          },
          {
            OR: [
              { rabbi: { status: "APPROVED", isBlocked: false } },
              { rabbiId: null },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        broadcastType: true,
        rabbi: { select: { name: true, slug: true } },
        organizerName: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: limit - 4,
    }),
    db.category.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, _count: { select: { lessons: true } } },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    rabbis: rabbis.map((r) => ({
      type: "rabbi" as const,
      name: r.name,
      slug: r.slug,
      photoUrl: r.photoUrl,
      lessonCount: r._count.lessons,
      href: `/rabbi/${r.slug}`,
    })),
    lessons: lessons.map((l) => ({
      type: "lesson" as const,
      id: l.id,
      title: l.title,
      rabbiName: l.rabbi?.name ?? l.organizerName ?? "—",
      scheduledAt: l.scheduledAt.toISOString(),
      broadcastType: l.broadcastType,
      href: `/lesson/${l.id}`,
    })),
    topics: categories.map((c) => ({
      type: "topic" as const,
      name: c.name,
      lessonCount: c._count.lessons,
      href: `/lessons?topic=${encodeURIComponent(c.name)}`,
    })),
  });
}
