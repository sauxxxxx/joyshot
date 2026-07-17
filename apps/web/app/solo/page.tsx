import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SoloBooth } from "@/features/solo/SoloBooth";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Solo Booth",
  description: "Take four photos and create a private photo strip in your browser.",
};

export default function SoloPage() {
  return (
    <>
      <a className="skipLink" href="#solo-main">Skip to the booth</a>
      <SiteHeader />
      <main className="container" id="solo-main">
        <Link className={styles.backLink} href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Back to booth modes
        </Link>
        <SoloBooth />
      </main>
    </>
  );
}
