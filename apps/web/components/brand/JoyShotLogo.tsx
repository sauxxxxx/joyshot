import Link from "next/link";
import styles from "./JoyShotLogo.module.css";

export function JoyShotLogo({ inverted = false, seal = false }: { inverted?: boolean; seal?: boolean }) {
  return <Link className={`${styles.logo} ${inverted ? styles.inverted : ""}`} href="/" aria-label="JoyShot home">
    <span className={styles.roll} aria-hidden="true"><i /><i /><i /><i /></span>
    <span className={styles.word}>JoyShot</span>
    {seal && <small>internet photo booth</small>}
  </Link>;
}
