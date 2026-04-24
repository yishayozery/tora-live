import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getAllBlogPosts } from "@/lib/blog";

const SITE = "https://tora-live.co.il";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages — with hreflang alternates
  const staticPages: MetadataRoute.Sitemap = [
    "", "/lessons", "/rabbis", "/donate", "/contact", "/about",
    "/accessibility", "/terms", "/login", "/register",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1.0 : 0.7,
    alternates: {
      languages: {
        he: `${SITE}${path}`,
        en: `${SITE}/en${path}`,
      },
    },
  }));

  // Blog index + posts (from content/blog/*.md)
  const blogIndex: MetadataRoute.Sitemap = [{
    url: `${SITE}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }];
  const blogPages: MetadataRoute.Sitemap = getAllBlogPosts().map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic: all approved lessons (tolerate DB unavailable at build time)
  let lessonPages: MetadataRoute.Sitemap = [];
  let rabbiPages: MetadataRoute.Sitemap = [];
  try {
    const lessons = await db.lesson.findMany({
      where: { approvalStatus: "APPROVED", isPublic: true, isSuspended: false },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    lessonPages = lessons.map((l) => ({
      url: `${SITE}/lesson/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const rabbis = await db.rabbi.findMany({
      where: { status: "APPROVED", isBlocked: false },
      select: { slug: true, updatedAt: true },
    });
    rabbiPages = rabbis.map((r) => ({
      url: `${SITE}/rabbi/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (err) {
    // DB unavailable (e.g. local build without DATABASE_URL) —
    // return static + blog pages only so sitemap still builds.
    console.warn("[sitemap] skipping dynamic lessons/rabbis:", (err as Error).message);
  }

  return [...staticPages, ...blogIndex, ...blogPages, ...rabbiPages, ...lessonPages];
}
