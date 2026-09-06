"use client";

import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import styles from "./FrameShowcase.module.css";

const themeIds = Object.keys(stripThemes) as StripThemeId[];
const demoPhotos = [
  "/images/demo-friends-blue.webp",
  "/images/demo-friends-sage.webp",
  "/images/demo-solo-clay.webp",
  "/images/demo-couple-lilac.webp",
];
const tilts = [-3.2, 2.1, -1.4, 3.4, -2.3, 1.2, -3.8, 2.7, -.8, 1.8];

function reducePreview(source: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 260;
      canvas.height = Math.round(image.height * canvas.width / image.width);
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Preview canvas unavailable"));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", .82));
    };
    image.onerror = () => reject(new Error("Preview image unavailable"));
    image.src = source;
  });
}

function circularOffset(index: number, active: number) {
  const direct = index - active;
  if (direct > themeIds.length / 2) return direct - themeIds.length;
  if (direct < -themeIds.length / 2) return direct + themeIds.length;
  return direct;
}

export function FrameShowcase() {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [previews, setPreviews] = useState<Partial<Record<StripThemeId, string>>>({});
  const pointerStart = useRef<number | null>(null);
  const activeId = themeIds[active];
  const theme = stripThemes[activeId];
  const choose = (index: number) => { setActive((index + themeIds.length) % themeIds.length); setFlipped(false); };

  useEffect(() => {
    let live = true;
    const render = async () => {
      for (const [index, themeId] of themeIds.entries()) {
        try {
          const orderedPhotos = demoPhotos.map((_, photoIndex) => demoPhotos[(photoIndex + index) % demoPhotos.length]);
          const strip = await drawSoloStrip(orderedPhotos, themeId, "strip", { title: "JoyShot", caption: stripThemes[themeId].label });
          const preview = await reducePreview(strip);
          if (live) setPreviews((current) => ({ ...current, [themeId]: preview }));
        } catch { /* Keep the photographic fallback visible. */ }
      }
    };
    void render();
    return () => { live = false; };
  }, []);

  const renderedCount = useMemo(() => Object.keys(previews).length, [previews]);
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const travel = event.clientX - pointerStart.current;
    if (Math.abs(travel) > 42) choose(active + (travel < 0 ? 1 : -1));
    pointerStart.current = null;
  };

  return <section className={styles.showcase} id="frames" aria-labelledby="frame-showcase-title">
    <div className={styles.copy}>
      <h2 id="frame-showcase-title">Pick a frame.<br />Make it yours.</h2>
      <p>Ten real designs. Drag the strips, use the arrows, or tap one to bring it forward.</p>
    </div>
    <div className={styles.stage} tabIndex={0} aria-label="Interactive frame selector" onKeyDown={(event) => {
      if (event.key === "ArrowLeft") choose(active - 1);
      if (event.key === "ArrowRight") choose(active + 1);
    }} onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={handlePointerUp}>
      {themeIds.map((themeId, index) => {
        const offset = circularOffset(index, active);
        const isActive = offset === 0;
        const style = { "--offset": offset, "--tilt": `${tilts[index]}deg`, "--paper": stripThemes[themeId].background } as CSSProperties;
        return <button className={`${styles.strip} ${isActive ? styles.active : ""}`} data-hidden={Math.abs(offset) > 3} style={style} type="button" key={themeId}
          aria-label={`${stripThemes[themeId].label}${isActive ? ", selected. Tap to turn over" : ""}`} aria-pressed={isActive}
          onClick={() => isActive ? setFlipped((value) => !value) : choose(index)}>
          <span className={`${styles.stripInner} ${isActive && flipped ? styles.flipped : ""}`}>
            <span className={styles.front}><img src={previews[themeId] || demoPhotos[index % demoPhotos.length]} alt="" /></span>
            <span className={styles.back}><strong>{stripThemes[themeId].label}</strong><small>{stripThemes[themeId].description}</small><i>Tap to turn back</i></span>
          </span>
        </button>;
      })}
      <button className={`${styles.arrow} ${styles.previous}`} type="button" onClick={() => choose(active - 1)} aria-label="Previous frame">←</button>
      <button className={`${styles.arrow} ${styles.next}`} type="button" onClick={() => choose(active + 1)} aria-label="Next frame">→</button>
    </div>
    <div className={styles.choice} aria-live="polite">
      <span>{String(active + 1).padStart(2, "0")} / {themeIds.length}</span>
      <div><strong>{theme.label}</strong><small>{theme.description}</small></div>
      <button type="button" onClick={() => setFlipped((value) => !value)}>{flipped ? "Show photos" : "Turn it over"}</button>
      <Link href={`/solo?frame=${activeId}`}>Use this frame</Link>
    </div>
    <span className={styles.renderStatus} aria-live="polite">{renderedCount === themeIds.length ? "All frame previews ready" : `Preparing frames ${renderedCount}/${themeIds.length}`}</span>
  </section>;
}
