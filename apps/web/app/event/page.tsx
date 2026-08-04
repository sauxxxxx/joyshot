import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EventSetup } from "@/features/event/EventSetup";

export const metadata: Metadata = { title: "Event Booth", description: "Configure a branded JoyShot event photobooth." };
export default function EventPage() { return <><SiteHeader /><main className="container"><EventSetup /></main></>; }
