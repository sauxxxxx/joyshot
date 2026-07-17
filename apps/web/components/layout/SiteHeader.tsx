import { Camera, GitBranch } from "lucide-react";
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
          <a className={styles.navLink} href="#how-it-works">
            How it works
          </a>
          <span className={styles.buildBadge} title="Local development build">
            <GitBranch size={15} aria-hidden="true" />
            MVP build
          </span>
        </nav>
      </div>
    </header>
  );
}
