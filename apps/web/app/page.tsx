import { ArrowRight, Camera, Heart, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { PhotoStripArt } from "@/components/landing/PhotoStripArt";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "./page.module.css";

const steps = [
  { number: "01", title: "Pick a booth", text: "Shoot solo now, or open a private booth for two." },
  { number: "02", title: "Strike four poses", text: "A friendly countdown keeps every capture on beat." },
  { number: "03", title: "Keep the moment", text: "Your finished photo strip is built privately in your browser." },
];

export default function HomePage() {
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <SiteHeader />
      <main id="main-content">
        <section className={`container ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <span className="eyebrow"><Sparkles size={17} /> Your moment, your booth</span>
            <h1>Photo booth magic, wherever you are.</h1>
            <p className={styles.lede}>
              Capture a classic strip on your own, or open a private room and share the same
              countdown with someone miles away.
            </p>
            <div className={styles.heroActions}>
              <Link className="button buttonPrimary" href="/solo">
                <Camera size={20} aria-hidden="true" /> Start solo booth
              </Link>
              <a className="button buttonSecondary" href="#booth-modes">
                Explore modes <ArrowRight size={19} aria-hidden="true" />
              </a>
            </div>
            <div className={styles.privacyNote}>
              <LockKeyhole size={17} aria-hidden="true" />
              Camera access starts only when you allow it. Photos stay on this device in solo mode.
            </div>
          </div>
          <PhotoStripArt />
        </section>

        <section className={`container ${styles.modes}`} id="booth-modes" aria-labelledby="modes-title">
          <div className={styles.sectionHeading}>
            <span className="eyebrow">Choose your moment</span>
            <h2 id="modes-title">One booth, two ways to smile.</h2>
          </div>
          <div className={styles.modeGrid}>
            <article className={`${styles.modeCard} ${styles.soloCard}`}>
              <div className={styles.modeIcon}><Camera size={28} aria-hidden="true" /></div>
              <span className={styles.available}>Available now</span>
              <h3>Solo booth</h3>
              <p>Use your camera, follow four countdowns, pick a frame, and download your strip.</p>
              <Link className={styles.cardLink} href="/solo">
                Open solo booth <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
            <article className={`${styles.modeCard} ${styles.togetherCard}`}>
              <div className={styles.modeIcon}><UsersRound size={28} aria-hidden="true" /></div>
              <span className={styles.nextBadge}>Live rooms</span>
              <h3>Two-person booth</h3>
              <p>Share a private room, see both live cameras, and capture the same countdown together.</p>
              <Link className={styles.cardLink} href="/room">
                Create or join a room <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        <section className={styles.howSection} id="how-it-works" aria-labelledby="how-title">
          <div className="container">
            <div className={styles.sectionHeading}>
              <span className="eyebrow"><Heart size={17} /> Tiny ritual, lasting keepsake</span>
              <h2 id="how-title">Camera ready to photo strip in three steps.</h2>
            </div>
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step.number}>
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <span>JoyShot</span>
          <p>Built for smiles, not storage. Solo photos never leave your browser.</p>
        </div>
      </footer>
    </>
  );
}
