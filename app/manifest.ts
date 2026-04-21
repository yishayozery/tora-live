import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TORA_LIVE — שיעורי תורה אונליין",
    short_name: "TORA_LIVE",
    description: "פלטפורמת שיעורי תורה — שידורים חיים, רבנים, ולוח שנה",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6E8",
    theme_color: "#1E40AF",
    orientation: "portrait-primary",
    lang: "he",
    dir: "rtl",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "religion"],
  };
}
