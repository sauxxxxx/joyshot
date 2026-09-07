"use client";

import { Download, Grip, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import type { StripThemeId } from "@/features/strip/stripThemes";
import styles from "./GalleryWall.module.css";

const demoPhotos = ["/images/demo-friends-blue.webp", "/images/demo-friends-sage.webp", "/images/demo-solo-clay.webp", "/images/demo-couple-lilac.webp"];
const themes: StripThemeId[] = ["classic", "gingham", "negative", "scrapbook", "zine"];
const starts = [{ x: 0, y: 22 }, { x: 8, y: -12 }, { x: -8, y: 18 }, { x: 4, y: -6 }, { x: -5, y: 12 }];

export function GalleryWall() {
  const [strips, setStrips] = useState<string[]>([]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [opened, setOpened] = useState<number | null>(null);
  const [positions, setPositions] = useState(starts);
  const drag = useRef<{ index: number; x: number; y: number; baseX: number; baseY: number; moved: boolean } | null>(null);
  const suppressOpen = useRef(false);
  const viewer = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (opened !== null) viewer.current?.showModal(); else viewer.current?.close(); }, [opened]);
  useEffect(() => { let live = true; void Promise.all(themes.map((theme, index) => drawSoloStrip(demoPhotos, theme, "strip", { title: ["Us lately", "Sunday", "Still here", "No occasion", "Soft copy"][index], caption: "JOYSHOT / THIS DEVICE" }))).then((items) => live && setStrips(items)); return () => { live = false; }; }, []);
  const move = (event: ReactPointerEvent<HTMLElement>) => { const current = drag.current; if (!current) return; const x = current.baseX + event.clientX - current.x; const y = current.baseY + event.clientY - current.y; if (Math.abs(x - current.baseX) > 3 || Math.abs(y - current.baseY) > 3) current.moved = true; setPositions((items) => items.map((position, index) => index === current.index ? { x, y } : position)); };

  return <section className={styles.archive} aria-labelledby="gallery-wall-title">
    <div className={styles.archiveLabel}><h2 id="gallery-wall-title">Your pictures are still right here.</h2><p>Try these sample strips. Your own saved photos live in your private gallery, in this browser.</p><Link className="button buttonStamp" href="/gallery">Open my gallery</Link></div>
    <div className={styles.wall} aria-label="Interactive JoyShot gallery wall">
      {themes.map((theme, index) => hidden.includes(index) ? null : <article key={theme} style={{ "--x": `${positions[index].x}px`, "--y": `${positions[index].y}px`, "--tilt": `${[-4, 2.5, -1.5, 4, -2.5][index]}deg` } as React.CSSProperties} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); suppressOpen.current = false; drag.current = { index, x: event.clientX, y: event.clientY, baseX: positions[index].x, baseY: positions[index].y, moved: false }; }} onPointerMove={move} onPointerUp={() => { suppressOpen.current = Boolean(drag.current?.moved); drag.current = null; }}>
        <span className={styles.tape} aria-hidden="true" /><button type="button" className={styles.stripButton} onClick={() => { if (!suppressOpen.current) setOpened(index); suppressOpen.current = false; }} aria-label={`Open ${theme} strip`}>{strips[index] ? <img src={strips[index]} alt={`Rendered ${theme} JoyShot strip`} draggable={false} /> : <i className={styles.blank} />}</button>
        <div><Grip size={14} aria-hidden="true" /><a href={strips[index] || undefined} download={`joyshot-${theme}.png`} aria-label={`Download ${theme} strip`}><Download size={14} /></a><button type="button" onClick={() => setHidden((items) => [...items, index])} aria-label={`Remove ${theme} strip`}><X size={14} /></button></div>
      </article>)}
    </div>
    <dialog ref={viewer} className={styles.viewer} aria-label="Sample JoyShot strip" onCancel={() => setOpened(null)} onClick={event => { if (event.target === event.currentTarget) setOpened(null); }}>{opened !== null && strips[opened] && <><button type="button" autoFocus onClick={() => setOpened(null)} aria-label="Close strip"><X /></button><img src={strips[opened]} alt="Enlarged sample JoyShot strip" /></>}</dialog>
  </section>;
}
