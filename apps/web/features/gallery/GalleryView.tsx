"use client";

import { ArrowRight, Download, Images, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearGallery, deleteGalleryItem, listGalleryItems, type GalleryItem } from "./galleryStore";
import styles from "./GalleryView.module.css";

interface ViewItem extends GalleryItem { url: string; }

export function GalleryView() {
  const [items, setItems] = useState<ViewItem[] | null>(null);
  const urls = useRef<string[]>([]);
  const load = useCallback(async () => {
    urls.current.forEach(URL.revokeObjectURL);
    const nextItems = (await listGalleryItems()).map((item) => ({ ...item, url: URL.createObjectURL(item.image) }));
    urls.current = nextItems.map(({ url }) => url);
    setItems(nextItems);
  }, []);
  useEffect(() => { void load(); return () => urls.current.forEach(URL.revokeObjectURL); }, [load]);
  if (!items) return <div className={styles.empty}><LoaderCircle className={styles.spinner} /><p>Opening your private gallery...</p></div>;
  return <section className={styles.gallery} aria-labelledby="gallery-title">
    <header><div><span className="eyebrow"><Images size={17} /> On this device only</span><h1 id="gallery-title">Your private keepsakes.</h1><p>Photos are stored in this browser, not in a JoyShot account or cloud.</p></div>{items.length > 0 && <button type="button" onClick={() => void clearGallery().then(load)}><Trash2 size={17} /> Clear gallery</button>}</header>
    {items.length === 0 ? <div className={styles.empty}><Images size={40} /><h2>Your first keepsake starts here.</h2><p>Finish a booth and choose “Save to gallery.” It stays privately on this device.</p><Link className="button buttonPrimary" href="/solo">Take some photos <ArrowRight size={18} /></Link></div>
      : <div className={styles.grid}>{items.map((item) => <article key={item.id}><img src={item.url} alt={item.title} /><div><span>{item.mode} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(item.createdAt)}</span><h2>{item.title}</h2><div className={styles.actions}><a href={item.url} download={`joyshot-${item.id}.png`}><Download size={17} /> Download</a><button type="button" onClick={() => void deleteGalleryItem(item.id).then(load)}><Trash2 size={17} /> Delete</button></div></div></article>)}</div>}
  </section>;
}
