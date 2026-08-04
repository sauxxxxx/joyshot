"use client";

import { ArrowLeft, ArrowRight, Film, ImagePlus, RectangleVertical, RefreshCcw, Save, Share2, Square, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { saveGalleryItem, type GalleryItem } from "@/features/gallery/galleryStore";
import { createGif, createWebm, downloadBlob } from "@/features/media/exportAnimation";
import { createSocialImage } from "@/features/media/exportSocialImage";
import { shareImage } from "@/features/sharing/shareMedia";
import { createPhotoEdit, photoFilterCss, type PhotoEdit, type PhotoFilter } from "./photoEdits";
import styles from "./ResultStudio.module.css";

const filters: Array<{ id: PhotoFilter; label: string }> = [
  { id: "original", label: "Original" }, { id: "mono", label: "Mono" },
  { id: "warm", label: "Warm" }, { id: "cool", label: "Cool" },
  { id: "vintage", label: "Vintage" }, { id: "contrast", label: "Punchy" },
];

interface ResultStudioProps {
  photos: string[];
  strip: string | null;
  title: string;
  mode: GalleryItem["mode"];
  onEditsChange: (edits: PhotoEdit[]) => void;
  onRetake?: (index: number) => void;
  retentionHours?: number;
  initialEdits?: PhotoEdit[];
}

export function ResultStudio({ photos, strip, title, mode, onEditsChange, onRetake, retentionHours = 0, initialEdits }: ResultStudioProps) {
  const [edits, setEdits] = useState(() => initialEdits?.length === photos.length ? initialEdits : photos.map(createPhotoEdit));
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const active = edits[selected];

  const update = (patch: Partial<PhotoEdit>) => {
    const next = edits.map((edit, index) => index === selected ? { ...edit, ...patch } : edit);
    setEdits(next); onEditsChange(next);
  };
  const move = (direction: -1 | 1) => {
    const target = selected + direction;
    if (target < 0 || target >= edits.length) return;
    const next = [...edits]; [next[selected], next[target]] = [next[target], next[selected]];
    setEdits(next); setSelected(target); onEditsChange(next);
  };
  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label); setMessage(null);
    try { await task(); } catch (error) { setMessage(error instanceof Error ? error.message : "That export could not be completed."); }
    finally { setBusy(null); }
  };
  const socialHint = useMemo(() => edits.length > 4 ? "Eight frames animate in room order." : "Your four poses animate in order.", [edits.length]);

  return (
    <section className={styles.studio} aria-labelledby="editor-title">
      <div className={styles.heading}><div><span>Edit every frame</span><h2 id="editor-title">Finish it your way.</h2></div><p>{socialHint}</p></div>
      <div className={styles.photoRail} role="list" aria-label="Captured photos">
        {edits.map((edit, index) => <button key={`${edit.source.slice(-16)}-${index}`} type="button" role="listitem"
          className={index === selected ? styles.selected : ""} onClick={() => setSelected(index)} aria-label={`Edit photo ${index + 1}`}>
          <img src={edit.source} style={{ filter: photoFilterCss(edit) }} alt="" /><span>{index + 1}</span>
        </button>)}
      </div>
      {active && <div className={styles.editorGrid}>
        <div className={styles.activePreview}><img src={active.source} style={{ filter: photoFilterCss(active), transform: `scale(${active.zoom}) translate(${active.offsetX}%, ${active.offsetY}%)` }} alt={`Editing photo ${selected + 1}`} /></div>
        <div className={styles.editControls}>
          <fieldset><legend>Filter</legend><div className={styles.filterGrid}>{filters.map((filter) => <button key={filter.id} type="button" aria-pressed={active.filter === filter.id} onClick={() => update({ filter: filter.id })}>{filter.label}</button>)}</div></fieldset>
          <label>Brightness <output>{active.brightness}%</output><input type="range" min="60" max="140" value={active.brightness} onChange={(event) => update({ brightness: Number(event.target.value) })} /></label>
          <label>Contrast <output>{active.contrast}%</output><input type="range" min="70" max="150" value={active.contrast} onChange={(event) => update({ contrast: Number(event.target.value) })} /></label>
          <label>Zoom <output>{active.zoom.toFixed(1)}×</output><input type="range" min="1" max="2" step="0.1" value={active.zoom} onChange={(event) => update({ zoom: Number(event.target.value) })} /></label>
          <label>Horizontal position <output>{active.offsetX}</output><input type="range" min="-50" max="50" value={active.offsetX} onChange={(event) => update({ offsetX: Number(event.target.value) })} /></label>
          <label>Vertical position <output>{active.offsetY}</output><input type="range" min="-50" max="50" value={active.offsetY} onChange={(event) => update({ offsetY: Number(event.target.value) })} /></label>
          <div className={styles.orderActions}><button type="button" onClick={() => move(-1)} disabled={selected === 0}><ArrowLeft size={17} /> Move left</button><button type="button" onClick={() => move(1)} disabled={selected === edits.length - 1}>Move right <ArrowRight size={17} /></button>{onRetake && <button type="button" onClick={() => onRetake(selected)}><RefreshCcw size={17} /> Retake</button>}</div>
        </div>
      </div>}
      <div className={styles.exportActions}>
        <button className="button buttonSecondary" type="button" disabled={!strip || busy !== null} onClick={() => strip && void run("share", async () => { const shared = await shareImage(strip, "joyshot.png", title); if (!shared) { downloadBlob(await fetch(strip).then((response) => response.blob()), "joyshot.png"); setMessage("Sharing is unavailable here, so the PNG was downloaded."); } })}><Share2 size={18} /> Share</button>
        <button className="button buttonSecondary" type="button" disabled={busy !== null} onClick={() => void run("gif", async () => downloadBlob(await createGif(edits), "joyshot.gif"))}><Film size={18} /> {busy === "gif" ? "Making GIF..." : "GIF"}</button>
        <button className="button buttonSecondary" type="button" disabled={busy !== null} onClick={() => void run("video", async () => downloadBlob(await createWebm(edits), "joyshot.webm"))}><Video size={18} /> {busy === "video" ? "Making video..." : "Video"}</button>
        <button className="button buttonSecondary" type="button" disabled={!strip || busy !== null} onClick={() => strip && void run("story", async () => downloadBlob(await fetch(await createSocialImage(strip, "story")).then((response) => response.blob()), "joyshot-story.png"))}><RectangleVertical size={18} /> Story</button>
        <button className="button buttonSecondary" type="button" disabled={!strip || busy !== null} onClick={() => strip && void run("square", async () => downloadBlob(await fetch(await createSocialImage(strip, "square")).then((response) => response.blob()), "joyshot-square.png"))}><Square size={18} /> Square</button>
        <button className="button buttonSecondary" type="button" disabled={!strip || busy !== null} onClick={() => strip && void run("save", async () => { await saveGalleryItem(strip, title, mode, retentionHours); setMessage("Saved privately on this device."); })}><Save size={18} /> Save to gallery</button>
      </div>
      {message && <p className={styles.message} role="status"><ImagePlus size={17} /> {message}</p>}
    </section>
  );
}
