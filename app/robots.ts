import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/my/"],
      },
    ],
    sitemap: "https://torah-live-rho.vercel.app/sitemap.xml",
    host: "https://torah-live-rho.vercel.app",
  };
}
