import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const headingFont = Fredoka({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JoyShot",
    template: "%s | JoyShot",
  },
  description: "Capture photo strips together, even when you are miles apart.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8f1",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
