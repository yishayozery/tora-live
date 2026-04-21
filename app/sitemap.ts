import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE = "https://torah-live-rho.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    "", "/lessons", "/rabbis", "/donate", "/contact", "/about",
    "/accessibility", "/terms", "/login", "/register",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1.0 : 0.7,
  }));

  // Dynamic: all approved lessons
  const lessons = await db.lesson.findMany({
    where: { approvalStatus: "APPROVED", isPublic: true, isSuspended: false },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  const lessonPages: MetadataRoute.Sitemap = lessons.map((l) => ({
    url: `${SITE}/lesson/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: all approved rabbis
  const rabbis = await db.rabbi.findMany({
    where: { status: "APPROVED", isBlocked: false },
    select: { slug: true, updatedAt: true },
  });
  const rabbiPages: MetadataRoute.Sitemap = rabbis.map((r) => ({
    url: `${SITE}/rabbi/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...rabbiPages, ...lessonPages];
}
