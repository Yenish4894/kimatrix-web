import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIMates — QR Purchase Tracking",
    short_name: "KIMates",
    description:
      "Simple, powerful purchase tracking for fuel stations and shops. Subscribe, get your QR code, start tracking.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F0F9FF",
    theme_color: "#0891B2",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
