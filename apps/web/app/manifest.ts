import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JoyShot Online Photobooth",
    short_name: "JoyShot",
    description: "A privacy-first solo and together photobooth.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#f05a67",
    orientation: "any",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Start solo booth", short_name: "Solo", url: "/solo" },
      { name: "Join a room", short_name: "Room", url: "/room" },
      { name: "Private gallery", short_name: "Gallery", url: "/gallery" },
    ],
  };
}
