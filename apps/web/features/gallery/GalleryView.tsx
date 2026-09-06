"use client";

import { ArrowRight, Download, Images, LoaderCircle, Share2, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { shareImage } from "@/features/sharing/shareMedia";
import { clearGallery, deleteGalleryItem, listGalleryItems, type GalleryItem } from "./galleryStore";
import styles from "./GalleryView.module.css";

interface ViewItem extends GalleryItem { url: string; }
const tilts = [-2.2, 1.4, -.8, 2.6, -1.3, 1.9, -.5, 2.1];

export function GalleryView() {
  const [items, setItems] = useState<ViewItem[] | null>(null);
  const [opened, setOpened] = useState<ViewItem | null>(null);
  const [message, setMessage] = useState("");
  const urls = useRef<string[]>([]);
  const load = useCallback(async () => {
    urls.current.forEach(URL.revokeObjectURL);
    const nextItems = (await listGalleryItems()).map((item) => ({ ...item, url: URL.createObjectURL(item.image) }));
    urls.current = nextItems.map(({ url }) => url); setItems(nextItems);
  }, []);
  useEffect(() => { void load(); return () => urls.current.forEach(URL.revokeObjectURL); }, [load]);
  const share = async (item: ViewItem) => {
    const shared = await shareImage(item.url, `joyshot-${item.id}.png`, item.title);
    setMessage(shared ? "Share sheet opened." : "Sharing files is not available in this browser. You can download the strip instead.");
  };
  if (!items) return <div className={styles.empty}><LoaderCircle className={styles.spinner} /><p>Opening your private gallery...</p></div>;
  return <section className={styles.gallery} aria-labelledby="gallery-title">
    <header><div><h1 id="gallery-title">Your private wall.</h1><p>Saved in this browser, never published automatically. Tap any strip to pick it up.</p></div>{items.length > 0 && <button type="button" onClick={() => void clearGallery().then(load)}><Trash2 size={17} /> Clear gallery</button>}</header>
    {items.length === 0 ? <div className={styles.empty}><Images size={40} /><h2>Your first strip starts here.</h2><p>Finish a booth and choose “Save to gallery.” It stays privately on this device.</p><Link className="button buttonPrimary" href="/solo">Take some photos <ArrowRight size={18} /></Link></div>
      : <div className={styles.wall}>{items.map((item, index) => <article key={item.id} style={{ "--tilt": `${tilts[index % tilts.length]}deg` } as CSSProperties}>
        <button className={styles.photoButton} type="button" onClick={() => setOpened(item)} aria-label={`Open ${item.title}`}><img src={item.url} alt={item.title} /></button>
        <div><span>{item.mode} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(item.createdAt)}</span><h2>{item.title}</h2><div className={styles.actions}><a href={item.url} download={`joyshot-${item.id}.png`}><Download size={16} /> Download</a><button type="button" onClick={() => void share(item)}><Share2 size={16} /> Share</button><button type="button" onClick={() => void deleteGalleryItem(item.id).then(load)}><Trash2 size={16} /> Delete</button></div></div>
      </article>)}</div>}
    {message && <p className={styles.message} role="status">{message}</p>}
    {opened && <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={opened.title} onClick={() => setOpened(null)}><div onClick={(event) => event.stopPropagation()}><button className={styles.close} type="button" onClick={() => setOpened(null)} aria-label="Close"><X /></button><img src={opened.url} alt={opened.title} /><footer><strong>{opened.title}</strong><a href={opened.url} download={`joyshot-${opened.id}.png`}><Download size={16} /> Download</a><button type="button" onClick={() => void share(opened)}><Share2 size={16} /> Share</button></footer></div></div>}
  </section>;
}
