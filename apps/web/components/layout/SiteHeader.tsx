import Link from "next/link";
import { JoyShotLogo } from "@/components/brand/JoyShotLogo";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`${styles.header} ${overlay ? styles.overlay : ""}`}>
      <div className={`container ${styles.inner}`}>
        <JoyShotLogo seal />
        <nav aria-label="Primary navigation">
          <Link className={styles.navLink} href="/room">Together</Link>
          <Link className={styles.navLink} href="/gallery">Gallery</Link>
          <Link className={styles.navLink} href="/event">Events</Link>
          <Link className={styles.boothLink} href="/solo"><span aria-hidden="true">●</span> Start</Link>
        </nav>
      </div>
    </header>
  );
}
