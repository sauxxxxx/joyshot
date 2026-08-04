import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaClient } from "@/components/pwa/PwaClient";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JoyShot",
    template: "%s | JoyShot",
  },
  description: "Capture photo strips together, even when you are miles apart.",
  applicationName: "JoyShot",
  appleWebApp: { capable: true, title: "JoyShot", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8f1",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}<PwaClient /></body>
    </html>
  );
}
