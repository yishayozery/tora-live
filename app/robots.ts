import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      // AI crawlers — allow public content + llms.txt
      {
        userAgent: "GPTBot",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
      {
        userAgent: "CCBot",
        allow: ["/", "/rabbi/", "/lesson/", "/lessons", "/rabbis", "/blog/", "/llms.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
    ],
    sitemap: "https://tora-live.co.il/sitemap.xml",
    host: "https://tora-live.co.il",
  };
}
