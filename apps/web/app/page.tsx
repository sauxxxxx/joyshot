import Image from "next/image";
import Link from "next/link";
import { JoyShotLogo } from "@/components/brand/JoyShotLogo";
import { CurtainEntry } from "@/components/landing/CurtainEntry";
import { EditingTable } from "@/components/landing/EditingTable";
import { FrameShowcase } from "@/components/landing/FrameShowcase";
import { GalleryWall } from "@/components/landing/GalleryWall";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "./page.module.css";

export default function HomePage() {
  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    <SiteHeader overlay />
    <main id="main-content">
      <section className={styles.hero}>
        <picture className={styles.heroPicture}>
          <source media="(max-width: 640px)" srcSet="/images/joyshot-hero-studio-mobile-v3.webp" />
          <img src="/images/joyshot-hero-studio-v3.webp" alt="A contemporary oxblood JoyShot booth in a quiet daylight studio" width="1672" height="941" fetchPriority="high" />
        </picture>
        <div className={styles.heroTitle}><h1>Four photos.<br />Keep the good ones.</h1><p>No account. Nothing uploaded. Just step in.</p></div>
        <div className={styles.machinePlate} aria-hidden="true"><i /><b>JoyShot</b><small>INTERNET PHOTO BOOTH</small></div>
        <Link className={styles.heroHotspot} href="/solo" aria-label="Press the red button to start JoyShot"><span>PRESS TO START</span></Link>
        <Link className={styles.heroTogether} href="/room">Or bring someone with you →</Link>
      </section>

      <FrameShowcase />

      <EditingTable />

      <section className={`container ${styles.together}`}>
        <div className={styles.togetherTicket}><span>ADMIT TWO</span><b>ROOM / J7PK4M</b><i>both cameras ready</i></div>
        <div className={styles.togetherPhoto}><Image src="/images/joyshot-together-diptych.webp" alt="Two people in different rooms making the same pose during a synchronized booth" width={1448} height={1086} sizes="(max-width: 800px) 100vw, 64vw" /><strong aria-label="Countdown 3">3</strong></div>
        <div className={styles.togetherCopy}><h2>Send the room code.</h2><p>One countdown runs on both screens. You each get the same paired strip at the end.</p><Link className="button buttonStrip" href="/room">Start together</Link></div>
      </section>

      <GalleryWall />

      <section className={`container ${styles.events}`}>
        <div className={styles.eventCopy}><h2>A booth for your people.</h2><p>Set the name, colors, strip caption, and how long the gallery stays. Guests only see the booth—not the settings.</p><Link className="button buttonStamp" href="/event">Set up an event</Link></div>
        <figure><Image src="/images/joyshot-event-loft-v2.webp" alt="Friends sharing a new photo strip beside a pastel booth at a relaxed event" width={1536} height={1024} sizes="(max-width: 800px) 100vw, 64vw" /><figcaption>Birthday / studio party / team night / just because</figcaption></figure>
      </section>

      <CurtainEntry />
    </main>
    <footer className={styles.footer}><div className="container"><JoyShotLogo inverted seal /><p>Four frames from wherever you are.</p><nav aria-label="Footer navigation"><Link href="/solo">Booth</Link><Link href="/room">Together</Link><Link href="/gallery">Gallery</Link><Link href="/event">Events</Link></nav><small>Photos stay local unless you choose otherwise.</small></div></footer>
  </>;
}
