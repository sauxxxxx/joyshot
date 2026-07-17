import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { stripThemes, type StripThemeId } from "./stripThemes";
import styles from "./StripThemePicker.module.css";

interface StripThemePickerProps {
  label?: string;
  onChange: (theme: StripThemeId) => void;
  value: StripThemeId;
}

export function StripThemePicker({ label = "Choose your strip style", onChange, value }: StripThemePickerProps) {
  return (
    <section className={styles.picker} aria-labelledby="strip-style-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="strip-style-heading">{label}</h2>
          <p>Tap a preview to restyle your finished strip.</p>
        </div>
        <span>{Object.keys(stripThemes).length} designs</span>
      </div>
      <div className={styles.grid} role="radiogroup" aria-label="Photo strip style">
        {Object.entries(stripThemes).map(([id, theme]) => {
          const themeId = id as StripThemeId;
          const selected = value === themeId;
          return (
            <label
              className={`${styles.card} ${selected ? styles.selected : ""}`}
              key={id}
            >
              <input
                checked={selected}
                className="srOnly"
                name="strip-theme"
                onChange={() => onChange(themeId)}
                type="radio"
                value={id}
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
                <span className={styles.previewTitle}>JoyShot</span>
                <span className={styles.photo} />
                <span className={styles.photo} />
                <span className={styles.photo} />
                <span className={styles.previewFooter}>04 · moments</span>
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
