import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoomEntry } from "@/features/room/RoomEntry";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Two-Person Booth", description: "Create or join a private two-person photo booth." };

export default function RoomEntryPage() {
  return <><SiteHeader /><main className="container"><Link className={styles.backLink} href="/"><ArrowLeft size={18} /> Back home</Link><RoomEntry /></main></>;
}
