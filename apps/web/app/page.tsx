import Image from "next/image";
import Link from "next/link";
import { JoyShotLogo } from "@/components/brand/JoyShotLogo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "./page.module.css";

export default function HomePage() {
  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    <SiteHeader />
    <main id="main-content">
      <section className={styles.hero}>
        <div className={styles.heroNote}><span>Open daily</span><strong>00:00—24:00</strong></div>
        <div className={styles.heroTitle}><h1>Step inside.</h1><p>Four photos. One strip.<br />Keep it forever.</p></div>
        <div className={styles.boothMachine}>
          <Image src="/images/joyshot-booth-machine-v2.webp" alt="A restored oxblood photo booth with a curtain, camera and printed strip" width={1023} height={1537} priority sizes="(max-width: 700px) 86vw, 510px" />
          <div className={styles.boothControls}>
            <Link href="/solo"><span>Press to begin</span><b aria-hidden="true" /></Link>
            <Link href="/room">Bring someone with you →</Link>
          </div>
        </div>
        <p className={styles.privacySlip}>No account. Nothing uploaded.<br />Your camera stays yours.</p>
        <span className={styles.heroIndex}>JS / 001</span>
      </section>

      <section className={`container ${styles.process}`} id="how-it-works">
        <header><h2>Four frames.<br />No pressure.</h2><p>Bad third photo? Take number three again. Keep moving when it feels right.</p></header>
        <figure>
          <Image src="/images/joyshot-contact-sheet.webp" alt="A four-frame contact sheet showing a photo session and one marked retake" width={1600} height={878} sizes="(max-width: 700px) 100vw, 72vw" />
          <figcaption><span>1 — Camera opens</span><span>2 — Countdown runs</span><span>3 — Retake this one</span><span>4 — Keep the strip</span></figcaption>
        </figure>
        <Link className={styles.underlinedLink} href="/solo">Try a four-frame session →</Link>
      </section>

      <section className={styles.editing}>
        <div className={styles.editingImage}><Image src="/images/joyshot-editing-studio-v2.webp" alt="Four contemporary portraits beside a tablet with crop and filter controls" fill sizes="(max-width: 800px) 100vw, 62vw" /></div>
        <aside><h2>Keep that one.</h2><p>Then warm it up, crop it closer, move it first, or write something underneath.</p>
          <dl><div><dt>Retake</dt><dd>one frame, not all four</dd></div><div><dt>Finish</dt><dd>filters, crop, layout, caption</dd></div><div><dt>Export</dt><dd>PNG, GIF, video, or social size</dd></div></dl>
          <Link className={styles.paperButton} href="/solo">Open the editing room</Link>
        </aside>
      </section>

      <section className={`container ${styles.together}`}>
        <div className={styles.togetherTicket}><span>ADMIT TWO</span><b>ROOM / J7PK4M</b><i>both cameras ready</i></div>
        <div className={styles.togetherPhoto}><Image src="/images/joyshot-together-diptych.webp" alt="Two people in different rooms making the same pose during a synchronized booth" width={1448} height={1086} sizes="(max-width: 800px) 100vw, 64vw" /><strong aria-label="Countdown 3">3</strong></div>
        <div className={styles.togetherCopy}><h2>Send the room code.</h2><p>One countdown runs on both screens. You each get the same paired strip at the end.</p><Link className={styles.darkButton} href="/room">Start together</Link></div>
      </section>

      <section className={styles.archive}>
        <Image src="/images/joyshot-gallery-wall-v2.webp" alt="A contemporary personal gallery of friends and photo strips on a pale modular wall" fill sizes="100vw" />
        <div className={styles.archiveLabel}><h2>Your pictures,<br />still right here.</h2><p>Your gallery lives in this browser for now. Open a strip, download it again, or clear the collection.</p><Link href="/gallery">Open my gallery →</Link></div>
      </section>

      <section className={`container ${styles.events}`}>
        <div className={styles.eventCopy}><h2>A booth for your people.</h2><p>Set the name, colors, strip caption, and how long the gallery stays. Guests only see the booth—not the settings.</p><Link className={styles.paperButton} href="/event">Set up an event</Link></div>
        <figure><Image src="/images/joyshot-event-loft-v2.webp" alt="Friends sharing a new photo strip beside a pastel booth at a relaxed event" width={1536} height={1024} sizes="(max-width: 800px) 100vw, 64vw" /><figcaption>Birthday / studio party / team night / just because</figcaption></figure>
      </section>

      <section className={styles.lastCall}>
        <div className={styles.curtain} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div><h2>Come as you are.</h2><p>The timer can wait three, five, or ten seconds. You decide.</p><Link href="/solo"><b aria-hidden="true" /> Start the booth</Link></div>
      </section>
    </main>
    <footer className={styles.footer}><div className="container"><JoyShotLogo inverted seal /><p>Four frames from wherever you are.</p><nav aria-label="Footer navigation"><Link href="/solo">Booth</Link><Link href="/room">Together</Link><Link href="/gallery">Gallery</Link><Link href="/event">Events</Link></nav><small>Photos stay local unless you choose otherwise.</small></div></footer>
  </>;
}
