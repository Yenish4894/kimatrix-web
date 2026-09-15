import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIMates — QR Purchase Tracking",
    short_name: "KIMates",
    description:
      "QR-based customer purchase tracking for fuel stations and shops. Start a free trial — no card required.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F0F9FF",
    theme_color: "#0891B2",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
