import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GalleryView } from "@/features/gallery/GalleryView";

export const metadata: Metadata = { title: "Private Gallery", description: "View JoyShot keepsakes stored privately in this browser." };

export default function GalleryPage() {
  return <><SiteHeader /><main className="container"><GalleryView /></main></>;
}
