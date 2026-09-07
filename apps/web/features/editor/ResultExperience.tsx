"use client";

import type { BoothSettings } from "@photobooth/shared";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { saveGalleryItem, type GalleryItem } from "@/features/gallery/galleryStore";
import { downloadBlob } from "@/features/media/exportAnimation";
import { shareImage } from "@/features/sharing/shareMedia";
import { BoothSettingsPicker } from "@/features/strip/BoothSettingsPicker";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import type { StripThemeId } from "@/features/strip/stripThemes";
import { ResultStudio } from "./ResultStudio";
import type { PhotoEdit } from "./photoEdits";
import styles from "./ResultExperience.module.css";

interface Props {
  photos: string[]; edits: PhotoEdit[]; strip: string | null; updating: boolean;
  theme: StripThemeId; onTheme: (theme: StripThemeId) => void;
  settings: BoothSettings; onSettings: (settings: BoothSettings) => void;
  title: string; caption: string; onTitle: (value: string) => void; onCaption: (value: string) => void;
  onEdits: (edits: PhotoEdit[]) => void; onRetake?: (index: number) => void;
  onAgain?: () => void; mode: GalleryItem["mode"]; retentionHours?: number; error?: string | null; extra?: ReactNode;
}

export function ResultExperience(props: Props) {
  const [tool, setTool] = useState<"frame" | "photos" | "caption" | "formats" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const saved = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage("");
    try { await action(); } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("That action couldn't finish. Your photos are still here. Please try again.");
    } finally { setBusy(false); }
  };
  const download = async () => {
    if (!props.strip) return;
    downloadBlob(await fetch(props.strip).then(response => response.blob()), "joyshot.png");
    try {
      if (saved.current !== props.strip) await saveGalleryItem(props.strip, props.title, props.mode, props.retentionHours);
      saved.current = props.strip;
      setMessage("Photo downloaded and saved to your private gallery on this device.");
    } catch { setMessage("Photo downloaded. This browser couldn't save a gallery copy; keep your download."); }
  };
  const closeTool = () => { setTool(null); heading.current?.focus(); };

  return <section className={styles.result} aria-labelledby="result-heading">
    <header className={styles.heading}><h1 ref={heading} tabIndex={-1} id="result-heading">That's your <em>JoyShot.</em></h1><p>Four little moments. Yours to keep.</p></header>
    <div className={styles.composition} data-editing={tool !== null}>
      <div className={styles.printSurface}>
        {props.strip ? <img className={styles.print} src={props.strip} alt="Your finished JoyShot photo strip" /> : <div className={styles.developing} role="status"><span>Developing your photos…</span><div>{props.photos.map((photo, index) => <img key={index} src={photo} alt={`Captured photo ${index + 1}`} />)}</div></div>}
        {props.error && <p role="alert">{props.error}</p>}
      </div>
      <div className={styles.resultTools}>
        <div className={styles.actions}>
          <button className={styles.save} type="button" disabled={!props.strip || props.updating || busy} onClick={() => void run(download)}>{busy ? "One moment…" : "Save photo"}<span>PNG + private gallery copy</span></button>
          <button className="button buttonStamp" type="button" disabled={!props.strip || props.updating || busy} onClick={() => void run(async () => { if (props.strip && !(await shareImage(props.strip, "joyshot.png", props.title))) { await download(); setMessage("File sharing isn't available here, so your photo was downloaded instead."); } })}>Share</button>
          {props.onAgain && <button className="button buttonQuiet" type="button" onClick={props.onAgain}>Take another</button>}
        </div>
        <p className={styles.feedback} role="status">{message}</p>
        <div className={styles.toolBar} aria-label="Customize your photo">
          {(["frame", "photos", "caption", "formats"] as const).map(id => <button key={id} type="button" aria-expanded={tool === id} aria-controls="result-tool-panel" onClick={() => setTool(tool === id ? null : id)}>{({ frame: "Frame & layout", photos: "Edit photos", caption: "Caption", formats: "More formats" })[id]}</button>)}
        </div>
        {tool && <section className={styles.toolPanel} id="result-tool-panel" aria-label="Photo customization">
          <button className={styles.close} type="button" onClick={closeTool}>Done editing ×</button>
          {tool === "frame" && <><StripThemePicker label="Try another frame" photos={props.photos.slice(0, 4)} value={props.theme} onChange={props.onTheme} /><BoothSettingsPicker settings={props.settings} onChange={props.onSettings} showTimer={false} /></>}
          {tool === "caption" && <div className={styles.caption}><label>Title<input maxLength={34} value={props.title} onChange={event => props.onTitle(event.target.value)} /></label><label>A little note<input maxLength={64} placeholder="Remember this one" value={props.caption} onChange={event => props.onCaption(event.target.value)} /></label></div>}
          {(tool === "photos" || tool === "formats") && <ResultStudio key={tool} photos={props.photos} initialEdits={props.edits} strip={props.updating ? null : props.strip} title={props.title} mode={props.mode} retentionHours={props.retentionHours} onEditsChange={props.onEdits} onRetake={props.onRetake} toolsOnly={tool} layout={props.settings.layout} />}
        </section>}
        <div className={styles.archive}><Link href="/gallery">Open my gallery →</Link><span>Saved here, on this device.</span></div>
        {props.extra}
      </div>
    </div>
  </section>;
}
