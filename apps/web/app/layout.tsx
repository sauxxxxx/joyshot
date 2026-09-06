import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaClient } from "@/components/pwa/PwaClient";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joyshot.vercel.app"),
  title: {
    default: "JoyShot",
    template: "%s | JoyShot",
  },
  description: "Capture photo strips together, even when you are miles apart.",
  applicationName: "JoyShot",
  appleWebApp: { capable: true, title: "JoyShot", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "JoyShot — Make a little moment last",
    description: "A private online photo booth for solo, together, and event moments.",
    images: ["/images/joyshot-hero-studio-v3.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efe6",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}<PwaClient /></body>
    </html>
  );
}
