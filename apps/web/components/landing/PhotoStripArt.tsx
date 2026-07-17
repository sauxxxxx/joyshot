import styles from "./PhotoStripArt.module.css";

const poses = ["poseOne", "poseTwo", "poseThree", "poseFour"] as const;

export function PhotoStripArt() {
  return (
    <div className={styles.stage} aria-label="Illustration of a four-photo strip">
      <div className={styles.sparkleOne} aria-hidden="true" />
      <div className={styles.sparkleTwo} aria-hidden="true" />
      <div className={styles.strip}>
        <div className={styles.stripTitle}>us, right now</div>
        {poses.map((pose, index) => (
          <div className={styles.photo} key={pose}>
            <div className={`${styles.person} ${styles.personOne} ${styles[pose]}`} />
            <div className={`${styles.person} ${styles.personTwo} ${styles[pose]}`} />
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
        ))}
        <div className={styles.stripFooter}>JOYSHOT · TOGETHER</div>
      </div>
      <div className={styles.note} aria-hidden="true">
        no distance too far
      </div>
    </div>
  );
}
