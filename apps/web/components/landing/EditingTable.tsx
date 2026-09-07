"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./EditingTable.module.css";

const photos = [
  { src: "/images/demo-friends-blue.webp", alt: "Two friends laughing in the booth" },
  { src: "/images/demo-friends-sage.webp", alt: "Two friends posing against a sage curtain" },
  { src: "/images/demo-solo-clay.webp", alt: "A playful solo booth portrait" },
  { src: "/images/demo-couple-lilac.webp", alt: "A couple making a surprised booth pose" },
];
const looks = { clean: "none", warm: "sepia(.18) saturate(.9) contrast(1.04)", soft: "saturate(.72) contrast(.92) brightness(1.04)", mono: "grayscale(1) contrast(1.08)" } as const;
type Look = keyof typeof looks;

export function EditingTable() {
  const [selected, setSelected] = useState(0);
  const [look, setLook] = useState<Look>("clean");
  const [positions, setPositions] = useState(photos.map(() => ({ x: 0, y: 0 })));
  const drag = useRef<{ x: number; y: number; photoX: number; photoY: number } | null>(null);
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const x = Math.max(-22, Math.min(22, drag.current.photoX + (event.clientX - drag.current.x) / 7));
    const y = Math.max(-18, Math.min(18, drag.current.photoY + (event.clientY - drag.current.y) / 7));
    setPositions((current) => current.map((position, index) => index === selected ? { x, y } : position));
  };
  const photoStyle = (index: number) => ({ filter: looks[look], objectPosition: `${50 + positions[index].x}% ${50 + positions[index].y}%` });

  return <section className={styles.section} aria-labelledby="editing-title">
    <div className={styles.copy}>
      <span className={styles.labLabel}>JOYSHOT DARKROOM · TABLE 02</span>
      <h2 id="editing-title">Keep that one.</h2>
      <p>Pick a print, drag the crop, and try a finish. The strip on the lightbox keeps up.</p>
      <Link className="button buttonStrip" href="/solo">Make your own</Link>
    </div>
    <div className={styles.table}>
      <div className={styles.contactSheet} aria-label="Choose a photo to edit">
        {photos.map((photo, index) => <button key={photo.src} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
          <img src={photo.src} alt={photo.alt} style={photoStyle(index)} /><b>0{index + 1}</b>
        </button>)}
      </div>
      <div className={styles.cropStation}>
        <div className={styles.cropHeader}><span>FRAME 0{selected + 1}</span><span>DRAG TO REFRAME</span></div>
        <div className={styles.cropWindow} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, photoX: positions[selected].x, photoY: positions[selected].y }; }} onPointerMove={move} onPointerUp={() => { drag.current = null; }}>
          <img src={photos[selected].src} alt={`Editing ${photos[selected].alt}`} style={photoStyle(selected)} draggable={false} />
          <i className={styles.cropMarks} aria-hidden="true" />
        </div>
        <div className={styles.looks} aria-label="Photo finish">
          {(Object.keys(looks) as Look[]).map((item) => <button key={item} type="button" aria-pressed={look === item} onClick={() => setLook(item)}><i style={{ filter: looks[item] }} />{item}</button>)}
        </div>
      </div>
      <div className={styles.liveStrip} aria-label="Live photo strip preview">
        <span>LIVE PROOF</span>
        {photos.map((photo, index) => <img key={photo.src} src={photo.src} alt="" style={photoStyle(index)} />)}
        <b>KEEP THE GOOD ONES</b>
      </div>
    </div>
  </section>;
}
