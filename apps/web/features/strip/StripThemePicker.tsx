"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { drawSoloStrip } from "./drawSoloStrip";
import { stripThemes, type StripThemeId } from "./stripThemes";
import styles from "./StripThemePicker.module.css";

interface StripThemePickerProps {
  label?: string;
  onChange: (theme: StripThemeId) => void;
  photos?: string[];
  value: StripThemeId;
}

const featuredThemes = Object.keys(stripThemes) as StripThemeId[];

const demoPhotos = ["/images/demo-friends-blue.webp", "/images/demo-friends-sage.webp", "/images/demo-solo-clay.webp", "/images/demo-couple-lilac.webp"];

function shrink(source: string) {
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 94; canvas.height = Math.round(image.height * canvas.width / image.width); const context = canvas.getContext("2d"); context?.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/webp", .76)); };
    image.onerror = () => resolve(""); image.src = source;
  });
}

export function StripThemePicker({ label = "Choose your strip style", onChange, photos, value }: StripThemePickerProps) {
  const [previews, setPreviews] = useState<Partial<Record<StripThemeId, string>>>({});
  const previewPhotos = useMemo(() => photos?.length === 4 ? photos : demoPhotos, [photos]);
  useEffect(() => {
    let live = true; setPreviews({});
    const render = async () => {
      for (const themeId of featuredThemes) {
        try {
          const strip = await drawSoloStrip(previewPhotos, themeId, "strip", { caption: stripThemes[themeId].label });
          const preview = await shrink(strip);
          if (live && preview) setPreviews((current) => ({ ...current, [themeId]: preview }));
        } catch { /* The photographic fallback remains usable. */ }
      }
    };
    void render(); return () => { live = false; };
  }, [previewPhotos]);
  return (
    <section className={styles.picker} aria-labelledby="strip-style-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="strip-style-heading">{label}</h2>
          <p>Tap a preview to restyle your finished strip.</p>
        </div>
        <span>{featuredThemes.length} designed frames</span>
      </div>
      <div className={styles.grid} role="radiogroup" aria-label="Photo strip style">
        {featuredThemes.map((themeId) => {
          const theme = stripThemes[themeId];
          const selected = value === themeId;
          return (
            <label
              className={`${styles.card} ${selected ? styles.selected : ""}`}
              key={themeId}
            >
              <input
                checked={selected}
                className="srOnly"
                name="strip-theme"
                onChange={() => onChange(themeId)}
                type="radio"
                value={themeId}
              />
              <span
                className={styles.preview}
                data-motif={theme.motif}
                style={{
                  "--theme-accent": theme.accent,
                  "--theme-background": theme.background,
                  "--theme-foreground": theme.foreground,
                  "--theme-panel": theme.panel,
                } as CSSProperties}
                aria-hidden="true"
              >
                {previews[themeId] ? <img className={styles.renderedPreview} src={previews[themeId]} alt="" /> : <>
                  <span className={styles.previewTitle}>JoyShot</span>
                  {previewPhotos.map((photo, index) => <img className={styles.photo} src={photo} alt="" key={`${photo}-${index}`} />)}
                  <span className={styles.previewFooter}>04 · moments</span>
                </>}
              </span>
              <span className={styles.cardCopy}>
                <strong>{theme.label}</strong>
                <small>{theme.description}</small>
              </span>
              <span className={styles.check} aria-hidden="true"><Check size={15} strokeWidth={3} /></span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
