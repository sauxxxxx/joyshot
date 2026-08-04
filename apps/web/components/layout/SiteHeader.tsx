import { CalendarHeart, Camera, Images } from "lucide-react";
import Link from "next/link";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.brand} href="/" aria-label="JoyShot home">
          <span className={styles.logoMark} aria-hidden="true">
            <Camera size={22} strokeWidth={2.4} />
          </span>
          <span>JoyShot</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className={styles.navLink} href="/event"><CalendarHeart size={16} /> Events</Link>
          <Link className={styles.navLink} href="/gallery"><Images size={16} /> Gallery</Link>
        </nav>
      </div>
    </header>
  );
}
