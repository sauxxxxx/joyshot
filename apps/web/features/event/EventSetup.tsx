"use client";

import { Expand, ImagePlus, PartyPopper, Play, QrCode, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultEventProfile, readEventProfile, storeEventProfile, type EventProfile } from "./eventProfile";
import styles from "./EventSetup.module.css";

export function EventSetup() {
  const [profile, setProfile] = useState<EventProfile>(defaultEventProfile);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setProfile(readEventProfile() ?? defaultEventProfile); }, []);
  const update = <K extends keyof EventProfile>(key: K, value: EventProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const save = () => { storeEventProfile(profile); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (file.size > 600_000) return window.alert("Choose a logo smaller than 600 KB.");
    const reader = new FileReader(); reader.onload = () => update("logoSource", String(reader.result)); reader.readAsDataURL(file);
  };
  const fullscreen = () => void document.documentElement.requestFullscreen?.();
  return <section className={styles.setup} aria-labelledby="event-title">
    <div className={styles.intro}><span className="eyebrow"><PartyPopper size={17} /> Event mode</span><h1 id="event-title">Make JoyShot your guest booth.</h1><p>Brand the strip, run a full-screen kiosk, and keep an optional private gallery on this device.</p></div>
    <div className={styles.workspace}>
      <form onSubmit={(event) => { event.preventDefault(); save(); }}>
        <label>Event name<input maxLength={34} value={profile.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label>Strip caption<input maxLength={64} value={profile.caption} onChange={(event) => update("caption", event.target.value)} /></label>
        <label>Brand color<input className={styles.color} type="color" value={profile.brandColor} onChange={(event) => update("brandColor", event.target.value)} /></label>
        <label className={styles.file}><ImagePlus size={18} /> Event logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadLogo(event.target.files?.[0])} /></label>
        {profile.logoSource && <button className={styles.remove} type="button" onClick={() => update("logoSource", undefined)}><Trash2 size={16} /> Remove logo</button>}
        <label>Local gallery retention<select value={profile.retentionHours} onChange={(event) => update("retentionHours", Number(event.target.value) as EventProfile["retentionHours"])}><option value="24">24 hours</option><option value="168">7 days</option><option value="0">Until manually deleted</option></select></label>
        <button className="button buttonPrimary" type="submit">Save event setup</button>{saved && <span className={styles.saved} role="status">Event setup saved</span>}
      </form>
      <aside className={styles.preview} style={{ "--event-color": profile.brandColor } as React.CSSProperties}>
        {profile.logoSource ? <img src={profile.logoSource} alt="Uploaded event logo preview" /> : <PartyPopper size={42} />}
        <span>JoyShot event</span><h2>{profile.name || "Your event"}</h2><p>{profile.caption}</p>
        <div className={styles.actions}><Link className="button buttonPrimary" href="/solo?event=1" onClick={save}><Play size={18} /> Start event booth</Link><button className="button buttonSecondary" type="button" onClick={fullscreen}><Expand size={18} /> Full screen</button><Link className="button buttonSecondary" href="/gallery"><QrCode size={18} /> Event gallery</Link></div>
      </aside>
    </div>
  </section>;
}
