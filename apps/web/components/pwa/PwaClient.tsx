"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./PwaClient.module.css";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaClient() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") void navigator.serviceWorker.register("/sw.js");
    const handler = (event: Event) => {
      event.preventDefault(); setPrompt(event as InstallPromptEvent);
      setDismissed(sessionStorage.getItem("joyshot-install-dismissed") === "true");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!prompt || dismissed) return null;
  const dismiss = () => { sessionStorage.setItem("joyshot-install-dismissed", "true"); setDismissed(true); };
  return <aside className={styles.prompt} aria-label="Install JoyShot"><Download size={20} /><div><strong>Install JoyShot</strong><span>Open the booth full-screen from your home screen.</span></div><button type="button" onClick={() => void prompt.prompt().then(() => setDismissed(true))}>Install</button><button className={styles.close} type="button" onClick={dismiss} aria-label="Dismiss install suggestion"><X size={18} /></button></aside>;
}
