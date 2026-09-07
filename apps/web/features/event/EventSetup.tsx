"use client";

import { Expand, ImagePlus, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import { defaultEventProfile, readEventProfile, storeEventProfile, type EventProfile } from "./eventProfile";
import styles from "./EventSetup.module.css";

const demoPhotos = ["/images/demo-friends-blue.webp", "/images/demo-friends-sage.webp", "/images/demo-solo-clay.webp", "/images/demo-couple-lilac.webp"];

export function EventSetup() {
  const [profile, setProfile] = useState<EventProfile>(defaultEventProfile);
  const [preview, setPreview] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLElement>(null);
  useEffect(() => { setProfile(readEventProfile() ?? defaultEventProfile); }, []);
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      void drawSoloStrip(demoPhotos, profile.frame, "strip", { title: profile.name, caption: profile.caption, logoSource: profile.logoSource, brandColor: profile.brandColor }).then(async (image) => {
        const decoded = new Image(); decoded.src = image; await decoded.decode().catch(() => undefined);
        if (live) { setPreview(image); setError(""); }
      }).catch(() => { if (live) setError("The preview could not update. Try another image or frame."); });
    }, preview ? 110 : 0);
    return () => { live = false; window.clearTimeout(timer); };
  }, [profile]);
  const update = <K extends keyof EventProfile>(key: K, value: EventProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const save = () => { try { storeEventProfile(profile); setSaved(true); window.setTimeout(() => setSaved(false), 1800); return true; } catch { setError("This browser could not save the event setup. Free some storage and try again."); return false; } };
  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 600_000) { setError("Choose a PNG, JPEG, or WebP logo smaller than 600 KB."); return; }
    const reader = new FileReader(); reader.onload = () => update("logoSource", String(reader.result)); reader.readAsDataURL(file);
  };
  return <section className={styles.setup} aria-labelledby="event-title">
    <header className={styles.intro}><h1 id="event-title">Make it your event.</h1><p>Name it, frame it, and launch it. The preview changes as you work; guests never see these controls.</p></header>
    {error && <p role="alert">{error}</p>}
    <div className={styles.workspace}>
      <form onSubmit={(event) => { event.preventDefault(); save(); }}>
        <h2>Event details</h2>
        <details><summary>Frame & design</summary><StripThemePicker label="Choose the event frame" onChange={(frame) => update("frame", frame)} value={profile.frame} /></details>
        <label>Event name<input maxLength={34} value={profile.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label>Strip caption<input maxLength={64} value={profile.caption} onChange={(event) => update("caption", event.target.value)} /></label>
        <label>Accent color<input className={styles.color} type="color" value={profile.brandColor} onChange={(event) => update("brandColor", event.target.value)} /></label>
        <label className={styles.file}><ImagePlus size={18} /> Add event logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadLogo(event.target.files?.[0])} /></label>
        {profile.logoSource && <button className={styles.remove} type="button" onClick={() => update("logoSource", undefined)}><Trash2 size={16} /> Remove logo</button>}
        <label>Keep the local gallery for<select value={profile.retentionHours} onChange={(event) => update("retentionHours", Number(event.target.value) as EventProfile["retentionHours"])}><option value="24">24 hours</option><option value="168">7 days</option><option value="0">Until manually deleted</option></select></label>
        <button className="button buttonStamp" type="submit">Save event setup</button>{saved && <span className={styles.saved} role="status">Saved on this device</span>}
      </form>
      <aside className={styles.preview} ref={previewRef} style={{ "--event-color": profile.brandColor } as React.CSSProperties}>
        <div className={styles.previewCopy}><span>{profile.name || "Your event"}</span><p>{profile.caption || "Your caption"}</p></div>
        <div className={styles.strip}>{preview ? <img src={preview} alt={`Live ${profile.frame} event strip preview`} /> : <i className={styles.blankStrip} aria-label="Preparing the first preview" />}</div>
        <div className={styles.actions}><Link className="button buttonShutter" href={`/solo?event=1&frame=${profile.frame}`} onClick={event => { if (!save()) event.preventDefault(); }}><Play size={18} /> Launch guest booth</Link><button className="button buttonStrip" type="button" onClick={() => { void previewRef.current?.requestFullscreen?.().catch(() => setError("Full screen is unavailable. Launch the guest booth for the camera view.")); }}><Expand size={18} /> Full screen</button></div>
      </aside>
    </div>
  </section>;
}
