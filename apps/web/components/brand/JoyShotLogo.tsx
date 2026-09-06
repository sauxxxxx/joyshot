import Link from "next/link";
import styles from "./JoyShotLogo.module.css";

export function JoyShotLogo({ inverted = false }: { inverted?: boolean }) {
  return <Link className={`${styles.logo} ${inverted ? styles.inverted : ""}`} href="/" aria-label="JoyShot home">
    <svg viewBox="0 0 38 38" aria-hidden="true">
      <rect x="2" y="2" width="34" height="34" rx="17" />
      <circle cx="19" cy="19" r="7" />
      <path d="M19 7v4M19 27v4M7 19h4M27 19h4" />
    </svg>
    <span>JOYSHOT</span>
  </Link>;
}
