import { ArrowRight, ArrowUpRight, CalendarDays, Camera, Download, Images, LockKeyhole, Sparkles, UsersRound, WandSparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JoyShotLogo } from "@/components/brand/JoyShotLogo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import styles from "./page.module.css";

const steps = [
  { number: "01", icon: Camera, title: "Strike a pose", text: "Open your camera and let four friendly countdowns do the rest." },
  { number: "02", icon: WandSparkles, title: "Make it yours", text: "Retake a frame, add a film look, and finish your strip your way." },
  { number: "03", icon: Download, title: "Keep the moment", text: "Download, share, or tuck it safely into your private gallery." },
];

export default function HomePage() {
  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    <SiteHeader />
    <main id="main-content">
      <section className={styles.hero}>
        <Image className={styles.heroImage} src="/images/joyshot-booth-hero.webp" alt="Two friends laughing together in a vintage photo booth" fill priority sizes="100vw" />
        <div className={styles.heroShade} />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>The internet photo booth</span>
            <h1>Make a little<br />moment last.</h1>
            <p>Four photos. Your favorite look. One keepsake made right in your browser.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/solo">Open the booth <Sparkles size={18} /></Link>
              <Link className={styles.textCta} href="/room">Take photos together <ArrowRight size={17} /></Link>
            </div>
            <span className={styles.noSignup}><LockKeyhole size={15} /> No account required. Solo photos stay on your device.</span>
          </div>
        </div>
      </section>

      <div className={styles.marquee} aria-label="JoyShot features">
        <div><span>PHOTO STRIPS</span><i>✦</i><span>VINTAGE FILTERS</span><i>✦</i><span>PRIVATE BY DESIGN</span><i>✦</i><span>TOGETHER FROM ANYWHERE</span><i>✦</i><span>NO DOWNLOAD</span></div>
      </div>

      <section className={`container ${styles.how}`} id="how-it-works">
        <header className={styles.sectionHeader}><span>Developing your memories</span><h2>From camera to keepsake<br />without the fuss.</h2></header>
        <ol>{steps.map(({ number, icon: Icon, title, text }) => <li key={number}><span>{number}</span><Icon size={27} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </section>

      <section className={styles.studioSection}>
        <div className={`container ${styles.studioGrid}`}>
          <div className={styles.stripStage}>
            <span className={styles.tape} aria-hidden="true" />
            <Image src="/images/joyshot-strip-showcase.webp" alt="Four-frame black and white JoyShot of two friends" width={490} height={1725} sizes="(max-width: 700px) 68vw, 370px" />
            <span className={styles.dateStamp}>SUNDAY · 08:42 PM</span>
          </div>
          <div className={styles.studioCopy}>
            <span className={styles.kicker}>The finishing room</span>
            <h2>Your photos.<br />Your kind of beautiful.</h2>
            <p>Keep it clean or make it nostalgic. Every tool is there when you want it—and out of the way when you don’t.</p>
            <div className={styles.filterRail}><span>Original</span><span>Mono</span><span>Golden hour</span><span>Film ’98</span></div>
            <ul><li>Individual retakes</li><li>Crop and zoom</li><li>Frames and layouts</li><li>Captions and filters</li></ul>
            <Link className={styles.inkLink} href="/solo">Make your own <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.together}`}>
        <div className={styles.togetherCopy}><span className={styles.kicker}>JoyShot together</span><h2>Distance doesn’t cancel photo day.</h2><p>One countdown. Two cameras. A shared strip that belongs to both of you.</p><Link className={styles.lightButton} href="/room"><UsersRound size={18} /> Start a booth together</Link></div>
        <div className={styles.screenPair} aria-label="Illustration of a synchronized two-person booth">
          <div className={styles.screen}><span>YOU</span><div className={styles.portraitOne} /></div>
          <div className={styles.screen}><span>YOUR PERSON</span><div className={styles.portraitTwo} /></div>
          <strong>3</strong><small>ROOM J7PK4M · BOTH READY</small>
        </div>
      </section>

      <section className={`container ${styles.destinations}`}>
        <Link className={styles.destination} href="/gallery"><span><Images size={22} /> Your private archive</span><h2>Keep the good ones.</h2><p>Save finished strips on this device, reopen them, and take them wherever you like.</p><strong>Open gallery <ArrowUpRight size={18} /></strong></Link>
        <Link className={`${styles.destination} ${styles.eventCard}`} href="/event"><span><CalendarDays size={22} /> JoyShot for events</span><h2>Make the big day feel personal.</h2><p>Turn any screen into a branded guest booth for weddings, parties, and pop-ups.</p><strong>Create an event booth <ArrowUpRight size={18} /></strong></Link>
      </section>

      <section className={styles.privacySection}><div className="container"><LockKeyhole size={29} /><span>Private by design</span><h2>Your face isn’t our business.</h2><p>Solo photos are processed in your browser. Nothing leaves your device unless you choose to save or share it.</p></div></section>

      <section className={styles.finalCta}><div className="container"><span className={styles.kicker}>Ready when you are</span><h2>Fix your hair.<br />Make a JoyShot.</h2><Link className={styles.primaryCta} href="/solo">Open the booth <ArrowRight size={18} /></Link></div></section>
    </main>
    <footer className={styles.footer}><div className="container"><JoyShotLogo inverted /><p>The internet photo booth for moments worth keeping.</p><nav aria-label="Footer navigation"><Link href="/solo">Booth</Link><Link href="/room">Together</Link><Link href="/gallery">Gallery</Link><Link href="/event">Events</Link></nav><small>Made for little moments.</small></div></footer>
  </>;
}
