import { CalendarHeart } from "lucide-react";
import Link from "next/link";
import { JoyShotLogo } from "@/components/brand/JoyShotLogo";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <JoyShotLogo />
        <nav aria-label="Primary navigation">
          <Link className={styles.navLink} href="/event"><CalendarHeart size={16} /> Host an event</Link>
          <Link className={styles.navLink} href="/gallery">Gallery</Link>
          <Link className={styles.boothLink} href="/solo">Open booth</Link>
        </nav>
      </div>
    </header>
  );
}
