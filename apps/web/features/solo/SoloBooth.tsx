"use client";

import type { BoothSettings } from "@photobooth/shared";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPreview } from "@/components/camera/CameraPreview";
import { CameraControls } from "@/features/camera/CameraControls";
import { captureFrame } from "@/features/camera/captureFrame";
import { useCamera } from "@/features/camera/useCamera";
import { ResultExperience } from "@/features/editor/ResultExperience";
import { createPhotoEdit, type PhotoEdit } from "@/features/editor/photoEdits";
import { readEventProfile, type EventProfile } from "@/features/event/eventProfile";
import { promptForShot } from "@/features/session/posePrompts";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import styles from "./SoloBooth.module.css";

type View = "camera" | "capture" | "develop" | "result";
const DRAFT = "joyshot-current-session-v2";
const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

export function SoloBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sequence = useRef(0);
  const running = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<View>("camera");
  const camera = useCamera({ autoStart: booted && (view === "camera" || view === "capture") });
  const [videoReady, setVideoReady] = useState(false);
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [settings, setSettings] = useState<BoothSettings>({ countdownSeconds: 3, layout: "strip" });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [shots, setShots] = useState<string[]>([]);
  const [edits, setEdits] = useState<PhotoEdit[]>([]);
  const [strip, setStrip] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0);
  const [flash, setFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState("");
  const [title, setTitle] = useState("JoyShot");
  const [caption, setCaption] = useState("");
  const [eventProfile, setEventProfile] = useState<EventProfile | null>(null);
  const [tray, setTray] = useState<"frame" | "camera" | null>(null);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("event") === "1") {
      const profile = readEventProfile();
      if (profile) { setEventProfile(profile); setTitle(profile.name); setCaption(profile.caption); setTheme(profile.frame); }
    } else {
      try {
        const draft = JSON.parse(sessionStorage.getItem(DRAFT) || "null");
        if (draft && Array.isArray(draft.edits) && draft.edits.length === 4 && draft.edits.every((edit: PhotoEdit) => typeof edit.source === "string" && edit.source.startsWith("data:image/")) && draft.theme in stripThemes && ["strip", "grid", "postcard", "film"].includes(draft.settings?.layout)) {
          setEdits(draft.edits); setTheme(draft.theme); setSettings(draft.settings); setTitle(draft.title || "JoyShot"); setCaption(draft.caption || ""); setView("develop");
        }
      } catch { /* The camera is available when private storage cannot be read. */ }
    }
    const requestedFrame = params.get("frame");
    const timer = Number(params.get("timer"));
    if (requestedFrame && requestedFrame in stripThemes) setTheme(requestedFrame as StripThemeId);
    if ([3, 5, 10].includes(timer)) setSettings(current => ({ ...current, countdownSeconds: timer as 3 | 5 | 10 }));
    setBooted(true);
    return () => { sequence.current += 1; running.current = false; void audioRef.current?.close(); };
  }, []);

  useEffect(() => {
    setVideoReady(false);
    const video = videoRef.current;
    if (!video) return;
    const ready = () => setVideoReady(Boolean(video.videoWidth && video.readyState >= 2));
    video.addEventListener("loadeddata", ready);
    video.addEventListener("playing", ready);
    ready();
    return () => { video.removeEventListener("loadeddata", ready); video.removeEventListener("playing", ready); };
  }, [camera.stream, view === "camera" || view === "capture"]);

  useEffect(() => {
    if (edits.length !== 4 || (view !== "develop" && view !== "result")) return;
    let active = true;
    setUpdating(true); setError(null);
    const timer = window.setTimeout(() => {
      void drawSoloStrip(edits, theme, settings.layout, { title, caption, logoSource: eventProfile?.logoSource, brandColor: eventProfile?.brandColor })
        .then(async image => {
          const decoded = new Image(); decoded.src = image; await decoded.decode();
          if (!active) return;
          setStrip(image); setUpdating(false); setView("result");
        }).catch(() => {
          if (!active) return;
          setUpdating(false); setError("The print couldn't develop. Your four photos are safe here. Try again.");
        });
    }, view === "develop" ? 0 : 90);
    return () => { active = false; window.clearTimeout(timer); };
  }, [edits, theme, settings.layout, title, caption, eventProfile, view === "develop" || view === "result", renderVersion]);

  useEffect(() => {
    if (view !== "result" || edits.length !== 4 || eventProfile) return;
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(DRAFT, JSON.stringify({ edits, theme, settings, title, caption })); setDraftWarning(""); }
      catch { setDraftWarning("This browser can't keep a refresh copy. Save your photo before leaving."); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [edits, theme, settings, title, caption, view, eventProfile]);

  const cancel = useCallback(() => {
    sequence.current += 1; running.current = false;
    setCountdown(null); setFlash(false); setView("camera"); setError(null);
  }, []);

  useEffect(() => {
    if (view !== "capture") return;
    let active = true;
    let lock: WakeLockSentinel | undefined;
    if ("wakeLock" in navigator) void navigator.wakeLock.request("screen").then(value => { if (active) lock = value; else void value.release(); }).catch(() => undefined);
    const visibility = () => { if (document.hidden) { cancel(); setError("The countdown paused when you left the booth. Press the shutter when you're ready."); } };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("keydown", key);
    return () => { active = false; void lock?.release(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("keydown", key); };
  }, [view, cancel]);

  useEffect(() => { if (view === "camera") headingRef.current?.focus(); }, [view]);

  const tone = (frequency: number, duration: number) => {
    const audio = audioRef.current;
    if (muted || !audio || audio.state !== "running") return;
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.04, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  };

  const capture = async () => {
    if (running.current || camera.status !== "ready" || !videoReady) return;
    running.current = true;
    const id = ++sequence.current;
    const assertActive = () => { if (sequence.current !== id) throw new Error("cancelled"); };
    try {
      if (!muted && window.AudioContext) {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume().catch(() => undefined);
      }
      setTray(null); setShots([]); setView("capture"); setError(null);
      const indexes = retakeIndex === null ? [0, 1, 2, 3] : [retakeIndex];
      const captured: string[] = [];
      for (const index of indexes) {
        assertActive(); setShotIndex(index);
        for (let count = settings.countdownSeconds; count >= 1; count--) {
          setCountdown(count); if (count <= 3) tone(480 + (3 - count) * 90, .09);
          await wait(1000); assertActive();
        }
        if (!videoRef.current) throw new Error("The camera is not ready.");
        const photo = captureFrame(videoRef.current, { mirror: camera.mirrored, width: 1280, height: 960, quality: .9 });
        setCountdown(null); setFlash(true); tone(840, .13);
        captured.push(photo); setShots([...captured]);
        await wait(180); assertActive(); setFlash(false);
        if (index !== indexes[indexes.length - 1]) { await wait(650); assertActive(); }
      }
      const nextEdits = retakeIndex === null ? captured.map(createPhotoEdit) : edits.map((edit, index) => index === retakeIndex ? createPhotoEdit(captured[0]) : edit);
      setEdits(nextEdits); setStrip(null); setRetakeIndex(null); setView("develop"); camera.stop();
      running.current = false;
    } catch (failure) {
      if (sequence.current !== id) return;
      running.current = false; setCountdown(null); setFlash(false); setView("camera");
      setError(failure instanceof Error ? failure.message : "The photo couldn't be taken. Please try again.");
    }
  };

  const again = () => { setRetakeIndex(null); setShots([]); setError(null); setTray(null); setView("camera"); };
  const retake = (index: number) => { setRetakeIndex(index); setShots([]); setError(null); setTray(null); setView("camera"); };
  const cameraView = view === "camera" || view === "capture";

  return <main className={styles.booth} id="solo-main" data-view={view}>
    <header className={styles.topbar}>
      {view === "capture" ? <button type="button" onClick={cancel}>Cancel session</button> : <Link href="/">← Leave booth</Link>}
      <span className={styles.wordmark}>JoyShot</span>
      {cameraView ? <button type="button" aria-pressed={!muted} onClick={() => setMuted(value => !value)}>Sound {muted ? "off" : "on"}</button> : <Link href="/gallery">My gallery</Link>}
    </header>
    {cameraView && <section className={styles.cameraStage} aria-labelledby="booth-title">
      <div className={styles.operator}>
        <h1 id="booth-title" tabIndex={-1} ref={headingRef}>{view === "capture" ? (countdown === null ? "Got it." : promptForShot(shotIndex)) : retakeIndex !== null ? `Retake photo ${retakeIndex + 1}.` : "Step in. Be yourself."}</h1>
        <span>{view === "capture" ? `${shotIndex + 1} / 4` : retakeIndex !== null ? "The other three stay yours." : "Four photos. One press."}</span>
      </div>
      <div className={styles.viewfinder}>
        <CameraPreview flash={flash} mirrored={camera.mirrored} status={camera.status} stream={camera.stream} videoRef={videoRef} />
        {view === "capture" && <div className={styles.countdown} role="status" aria-live="assertive" aria-atomic="true"><strong key={`${shotIndex}-${countdown}`}>{countdown}</strong><span className="srOnly">Photo {shotIndex + 1} of 4</span></div>}
        {view === "capture" && <div className={styles.exposed} aria-label="Captured photos">{shots.map((photo, index) => <img src={photo} alt={`Captured photo ${index + 1}`} key={index} />)}</div>}
      </div>
      {(camera.error || error) && <div className={styles.error} role="alert"><p>{camera.error || error}</p>{camera.status === "error" && <button className="button buttonStrip" type="button" onClick={() => void camera.start()}>Try camera again</button>}</div>}
      {view === "camera" ? <footer className={styles.dock}>
        <div className={styles.smallControls}>
          <label>Timer<select aria-label="Countdown timer" value={settings.countdownSeconds} onChange={event => setSettings(current => ({ ...current, countdownSeconds: Number(event.target.value) as 3 | 5 | 10 }))}><option value={3}>3 seconds</option><option value={5}>5 seconds</option><option value={10}>10 seconds</option></select></label>
          <button type="button" aria-expanded={tray === "camera"} onClick={() => setTray(tray === "camera" ? null : "camera")}>Camera</button>
        </div>
        <button className={styles.shutter} type="button" onClick={() => void capture()} disabled={camera.status !== "ready" || !videoReady} aria-label={retakeIndex !== null ? `Take replacement photo ${retakeIndex + 1}` : "Take four photos"}><i aria-hidden="true" /><span>{retakeIndex !== null ? "Retake photo" : "Take four photos"}</span></button>
        <div className={styles.smallControls}><button type="button" aria-expanded={tray === "frame"} onClick={() => setTray(tray === "frame" ? null : "frame")}>Frame: {stripThemes[theme].label}</button>{edits.length === 4 && <button type="button" onClick={() => { camera.stop(); setRetakeIndex(null); setView(strip ? "result" : "develop"); }}>Back to my photos</button>}</div>
      </footer> : <div className={styles.captureProgress} role="status">{[0, 1, 2, 3].map(index => <span key={index} data-done={retakeIndex === null ? index < shots.length : index !== retakeIndex || shots.length > 0}>{index + 1}</span>)}</div>}
      {tray && view === "camera" && <section className={styles.tray} aria-label={tray === "frame" ? "Choose a frame" : "Camera settings"}><button className={styles.closeTray} type="button" onClick={() => setTray(null)}>Done ×</button>{tray === "frame" ? <StripThemePicker value={theme} onChange={setTheme} /> : <CameraControls devices={camera.devices} selectedDeviceId={camera.selectedDeviceId} mirrored={camera.mirrored} onSelect={id => void camera.selectDevice(id)} onFlip={() => void camera.flipCamera()} onMirrorChange={camera.setMirrored} />}</section>}
      <p className={styles.privacy}>{camera.status === "requesting" ? "Allow Camera in your browser to step inside." : "Your camera stays on this device."}</p>
    </section>}
    {!cameraView && <><ResultExperience photos={edits.map(edit => edit.source)} edits={edits} strip={strip} updating={updating} theme={theme} onTheme={setTheme} settings={settings} onSettings={setSettings} title={title} caption={caption} onTitle={setTitle} onCaption={setCaption} onEdits={setEdits} onRetake={retake} onAgain={again} mode={eventProfile ? "event" : "solo"} retentionHours={eventProfile?.retentionHours} error={error} extra={error ? <button className="button buttonStrip" type="button" onClick={() => setRenderVersion(value => value + 1)}>Develop again</button> : null} />{draftWarning && <p className={styles.privacy} role="status">{draftWarning}</p>}</>}
  </main>;
}
