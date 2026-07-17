import type { BoothSettings, CountdownSeconds, PhotoLayoutId } from "@photobooth/shared";
import { Check, Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./BoothSettingsPicker.module.css";

const timers: Array<{ value: CountdownSeconds; label: string; hint: string }> = [
  { value: 3, label: "3 sec", hint: "Quick" },
  { value: 5, label: "5 sec", hint: "Comfortable" },
  { value: 10, label: "10 sec", hint: "More time" },
];
const layouts: Array<{ value: PhotoLayoutId; label: string }> = [
  { value: "strip", label: "Classic Strip" },
  { value: "grid", label: "2 × 2 Grid" },
  { value: "postcard", label: "Postcard" },
  { value: "film", label: "Film Roll" },
];

export function BoothSettingsPicker({ disabled, settings, onChange, showTimer = true }: {
  disabled?: boolean; settings: BoothSettings; onChange: (settings: BoothSettings) => void; showTimer?: boolean;
}) {
  return <section className={styles.settings} aria-label="Booth settings">
    {showTimer && <fieldset><legend><Clock3 size={16} /> Countdown</legend><div className={styles.timerGrid}>
      {timers.map((timer) => <Choice key={timer.value} checked={settings.countdownSeconds === timer.value} disabled={disabled}
        name="countdown" onChange={() => onChange({ ...settings, countdownSeconds: timer.value })}>
        <strong>{timer.label}</strong><small>{timer.hint}</small>
      </Choice>)}
    </div></fieldset>}
    <fieldset><legend>Final photo layout</legend><div className={styles.layoutGrid}>
      {layouts.map((layout) => <Choice key={layout.value} checked={settings.layout === layout.value} disabled={disabled}
        name="layout" onChange={() => onChange({ ...settings, layout: layout.value })}>
        <span className={styles.layoutPreview} data-layout={layout.value} aria-hidden="true">
          {[0, 1, 2, 3].map((item) => <i key={item} />)}
        </span><strong>{layout.label}</strong>
      </Choice>)}
    </div></fieldset>
  </section>;
}

function Choice({ checked, children, disabled, name, onChange }: {
  checked: boolean; children: ReactNode; disabled?: boolean; name: string; onChange: () => void;
}) {
  return <label className={`${styles.choice} ${checked ? styles.selected : ""}`}>
    <input className="srOnly" type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} />
    {children}<span className={styles.check}>{checked && <Check size={13} />}</span>
  </label>;
}
