import type { MetadataRoute } from "next";

// Next.js serves this as /manifest.webmanifest. The browser reads it to know
// the app's name, icons and colors when you "Add to Home Screen".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cadence",
    short_name: "Cadence",
    description: "One calm place for your plans, habits, home and money.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffc300",
    theme_color: "#ffc300",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
