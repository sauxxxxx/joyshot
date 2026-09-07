"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { shareImage } from "@/features/sharing/shareMedia";
import { clearGallery, deleteGalleryItem, listGalleryItems, type GalleryItem } from "./galleryStore";
import styles from "./GalleryView.module.css";

interface ViewItem extends GalleryItem { url: string; }
const tilts = [-2.2, 1.4, -.8, 2.6, -1.3, 1.9];

export function GalleryView() {
  const [items, setItems] = useState<ViewItem[] | null>(null);
  const [opened, setOpened] = useState<ViewItem | null>(null);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);
  const request = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    const id = ++request.current;
    try {
      const saved = await listGalleryItems();
      if (id !== request.current) return;
      const nextItems = saved.map(item => ({ ...item, url: URL.createObjectURL(item.image) }));
      urls.current.forEach(URL.revokeObjectURL);
      urls.current = nextItems.map(item => item.url); setItems(nextItems); setFailure(false);
    } catch { if (id === request.current) { setFailure(true); setMessage("Your gallery couldn't open. Your browser may have restricted local storage."); } }
  }, []);
  useEffect(() => { void load(); return () => { request.current++; urls.current.forEach(URL.revokeObjectURL); }; }, [load]);
  useEffect(() => { if (opened) dialog.current?.showModal(); else dialog.current?.close(); }, [opened]);
  const share = async (item: ViewItem) => {
    try {
      const shared = await shareImage(item.url, `joyshot-${item.id}.png`, item.title);
      setMessage(shared ? "Photo shared." : "File sharing isn't available here. Use Save photo to download your copy.");
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Sharing failed. Your photo is still here; try downloading it."); }
  };
  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try { if (confirm === "all") await clearGallery(); else await deleteGalleryItem(confirm); setOpened(null); setConfirm(null); await load(); setMessage("Removed from this browser. Downloaded copies are unaffected."); }
    catch { setMessage("The photo couldn't be removed. Try again."); }
    finally { setBusy(false); }
  };
  return <section className={styles.gallery} aria-labelledby="gallery-title">
    <header><div><h1 id="gallery-title">Your private wall.</h1><p>Saved in this browser. Pick up a strip to keep or share it.</p></div><Link className="button buttonShutter" href="/solo">Take more photos</Link></header>
    {failure ? <div className={styles.empty}><p role="alert">{message}</p><button className="button buttonStrip" type="button" onClick={() => void load()}>Try opening gallery again</button></div>
      : !items ? <div className={styles.empty} role="status">Opening your saved photos…</div>
      : items.length === 0 ? <div className={styles.empty}><h2>A space for your first strip.</h2><p>Choose Save photo after your session. You'll get a download and a copy here.</p></div>
      : <div className={styles.wall}>{items.map((item, index) => <article key={item.id} style={{ "--tilt": `${tilts[index % tilts.length]}deg` } as CSSProperties}>
        <button className={styles.photoButton} type="button" onClick={() => setOpened(item)} aria-label={`Open ${item.title}`}><img src={item.url} alt={item.title} /></button>
        <div><span>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(item.createdAt)}</span><h2>{item.title}</h2><div className={styles.actions}><a href={item.url} download={`joyshot-${item.id}.png`}>Save photo</a><button type="button" onClick={() => void share(item)}>Share</button><button type="button" onClick={() => setConfirm(item.id)}>Remove</button></div></div>
      </article>)}</div>}
    {items && items.length > 0 && <button className="button buttonQuiet" type="button" onClick={() => setConfirm("all")}>Clear this gallery</button>}
    {confirm && <div className={styles.message} role="alert"><p>{confirm === "all" ? "Remove every saved photo from this browser?" : "Remove this photo from your gallery?"} Download it first if you want to keep a copy.</p><button className="button buttonStamp" type="button" disabled={busy} onClick={() => void remove()}>Remove {confirm === "all" ? "all photos" : "photo"}</button> <button className="button buttonQuiet" type="button" onClick={() => setConfirm(null)}>Keep it</button></div>}
    {message && !failure && !confirm && <p className={styles.message} role="status">{message}</p>}
    <dialog className={styles.photoDialog} ref={dialog} onCancel={() => setOpened(null)} onClick={event => { if (event.target === event.currentTarget) setOpened(null); }}>
      {opened && <><button className={styles.close} autoFocus type="button" onClick={() => setOpened(null)} aria-label="Close photo">×</button><img src={opened.url} alt={opened.title} /><footer><strong>{opened.title}</strong><a className="button buttonStamp" href={opened.url} download={`joyshot-${opened.id}.png`}>Save photo</a><button className="button buttonQuiet" type="button" onClick={() => void share(opened)}>Share</button></footer></>}
    </dialog>
  </section>;
}
