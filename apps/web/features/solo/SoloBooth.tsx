"use client";

import type { BoothSettings } from "@photobooth/shared";
import { Camera, Download, Images, LoaderCircle, RefreshCcw, Share2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPreview } from "@/components/camera/CameraPreview";
import { CameraControls } from "@/features/camera/CameraControls";
import { captureFrame } from "@/features/camera/captureFrame";
import { useCamera } from "@/features/camera/useCamera";
import { ResultStudio } from "@/features/editor/ResultStudio";
import { createPhotoEdit, type PhotoEdit } from "@/features/editor/photoEdits";
import { readEventProfile, type EventProfile } from "@/features/event/eventProfile";
import { saveGalleryItem } from "@/features/gallery/galleryStore";
import { shareImage } from "@/features/sharing/shareMedia";
import { promptForShot } from "@/features/session/posePrompts";
import { BoothSettingsPicker } from "@/features/strip/BoothSettingsPicker";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import styles from "./SoloBooth.module.css";

type BoothView = "ready" | "capture" | "editor";
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function SoloBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelledRef = useRef(false);
  const camera = useCamera();
  const [view, setView] = useState<BoothView>("ready");
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [settings, setSettings] = useState<BoothSettings>({ countdownSeconds: 5, layout: "strip" });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [edits, setEdits] = useState<PhotoEdit[]>([]);
  const [strip, setStrip] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("JoyShot");
  const [caption, setCaption] = useState("");
  const [eventProfile, setEventProfile] = useState<EventProfile | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedFrame = params.get("frame");
    if (requestedFrame && requestedFrame in stripThemes) setTheme(requestedFrame as StripThemeId);
    if (params.get("event") === "1") {
      const profile = readEventProfile();
      if (profile) { setEventProfile(profile); setTitle(profile.name); setCaption(profile.caption); setTheme(profile.frame); }
    }
  }, []);
  useEffect(() => () => { cancelledRef.current = true; }, []);
  useEffect(() => {
    if (photos.length !== 4 || view !== "editor") return;
    let active = true;
    setStrip(null);
    void drawSoloStrip(edits.length === 4 ? edits : photos, theme, settings.layout, {
      title, caption, logoSource: eventProfile?.logoSource, brandColor: eventProfile?.brandColor,
    }).then((image) => active && setStrip(image)).catch(() => active && setError("That design could not be rendered. Try another frame."));
    return () => { active = false; };
  }, [caption, edits, eventProfile, photos, settings.layout, theme, title, view]);
  useEffect(() => {
    if (view !== "capture" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock.request("screen").then((next) => { lock = next; }).catch(() => undefined);
    return () => { void lock?.release(); };
  }, [view]);

  const playTone = useCallback((frequency: number, duration: number) => {
    if (muted || !window.AudioContext) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration / 1000);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration / 1000);
    oscillator.addEventListener("ended", () => void audio.close());
  }, [muted]);

  const takeFrame = useCallback(async (index: number) => {
    setShotIndex(index);
    for (let count = settings.countdownSeconds; count >= 1; count -= 1) {
      setCountdown(count);
      if (count <= 3) playTone(520 + (3 - count) * 90, 120);
      await wait(1000);
      if (cancelledRef.current) throw new Error("Capture cancelled");
    }
    setCountdown(null); setFlash(true); playTone(880, 180);
    if (!videoRef.current) throw new Error("The camera preview is not ready.");
    const photo = captureFrame(videoRef.current, { mirror: camera.mirrored });
    await wait(320); setFlash(false);
    return photo;
  }, [camera.mirrored, playTone, settings.countdownSeconds]);

  const startSession = useCallback(async () => {
    if (camera.status !== "ready") return;
    cancelledRef.current = false; setError(null); setMessage(null); setPhotos([]); setEdits([]); setStrip(null); setView("capture");
    try {
      const captures: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        const photo = await takeFrame(index);
        captures.push(photo); setPhotos([...captures]);
        if (index < 3) await wait(650);
      }
      setPhotos(captures); setEdits(captures.map(createPhotoEdit)); setView("editor");
    } catch (captureError) {
      if (!cancelledRef.current) setError(captureError instanceof Error ? captureError.message : "Capture failed.");
      setView("ready");
    }
  }, [camera.status, takeFrame]);

  const retake = useCallback(async (index: number) => {
    cancelledRef.current = false; setError(null); setView("capture");
    try {
      const photo = await takeFrame(index);
      setPhotos((current) => current.map((item, itemIndex) => itemIndex === index ? photo : item));
      setEdits((current) => current.map((item, itemIndex) => itemIndex === index ? createPhotoEdit(photo) : item));
      setView("editor");
    } catch (captureError) {
      if (!cancelledRef.current) setError(captureError instanceof Error ? captureError.message : "Retake failed.");
      setView("editor");
    }
  }, [takeFrame]);

  const reset = () => {
    cancelledRef.current = true; setPhotos([]); setEdits([]); setStrip(null); setCountdown(null);
    setError(null); setMessage(null); setView("ready");
  };
  const download = () => { if (strip) { const anchor = document.createElement("a"); anchor.href = strip; anchor.download = `joyshot-${Date.now()}.png`; anchor.click(); } };
  const share = async () => { if (strip && !(await shareImage(strip, "joyshot.png", title))) { download(); setMessage("Sharing is unavailable here, so the PNG was downloaded."); } };
  const save = async () => { if (strip) { await saveGalleryItem(strip, title, eventProfile ? "event" : "solo", eventProfile?.retentionHours); setMessage("Saved privately on this device."); } };

  return <section className={`${styles.booth} ${view === "capture" ? styles.immersive : ""}`} aria-labelledby="booth-title">
    {view === "ready" && <>
      <header className={styles.intro}><h1 id="booth-title">Your booth is ready.</h1><p>Choose a frame, set the timer, and take four photos. You can change everything again afterward.</p></header>
      <div className={styles.readyWorkspace}>
        <div className={styles.cameraSide}><CameraPreview flash={flash} mirrored={camera.mirrored} status={camera.status} stream={camera.stream} videoRef={videoRef} /><p>Nothing from your camera is uploaded.</p></div>
        <aside className={styles.setupSide}>
          <StripThemePicker label="Pick a frame" onChange={setTheme} value={theme} />
          <BoothSettingsPicker settings={settings} onChange={setSettings} />
          {camera.status === "ready" && <CameraControls devices={camera.devices} mirrored={camera.mirrored} selectedDeviceId={camera.selectedDeviceId} onFlip={() => void camera.flipCamera()} onMirrorChange={camera.setMirrored} onSelect={(id) => void camera.selectDevice(id)} />}
          {camera.status !== "ready" ? <button className="button buttonPrimary" type="button" onClick={() => void camera.start()} disabled={camera.status === "requesting"}>{camera.status === "requesting" ? <LoaderCircle className={styles.spinner} /> : <Camera size={19} />}{camera.status === "requesting" ? "Starting camera..." : camera.status === "error" ? "Try camera again" : "Enable camera"}</button>
            : <button className="button buttonPrimary" type="button" onClick={() => void startSession()}><Camera size={19} /> Take four photos</button>}
          {(camera.error || error) && <p className={styles.error} role="alert">{camera.error || error}</p>}
        </aside>
      </div>
    </>}
    {view === "capture" && <CaptureScreen camera={camera} videoRef={videoRef} flash={flash} countdown={countdown} shotIndex={shotIndex} photos={photos} muted={muted} onMute={() => setMuted((value) => !value)} />}
    {view === "editor" && <div className={styles.editorWorkspace}>
      <header className={styles.editorHeading}><div><h1 id="booth-title">Keep the good ones.</h1><p>Retake a single frame or finish the strip right here.</p></div><button type="button" onClick={reset}><RefreshCcw size={16} /> New session</button></header>
      <div className={styles.captureRail}>{photos.map((photo, index) => <article key={`${photo.slice(-18)}-${index}`} style={{ "--tilt": `${[-1.8, 1.2, -.7, 2][index]}deg` } as React.CSSProperties}><img src={photo} alt={`Pose ${index + 1}`} /><button type="button" onClick={() => void retake(index)}><RefreshCcw size={15} /> Retake {index + 1}</button></article>)}</div>
      <div className={styles.designWorkspace}>
        <div className={styles.designControls}><StripThemePicker label="Frame style" photos={photos} onChange={setTheme} value={theme} /><BoothSettingsPicker settings={settings} onChange={setSettings} showTimer={false} />
          <div className={styles.textOptions}><label>Title<input maxLength={34} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Caption<input maxLength={64} value={caption} placeholder="Our Sunday" onChange={(event) => setCaption(event.target.value)} /></label></div>
        </div><StripPreview strip={strip} theme={theme} /></div>
      <ResultStudio photos={photos} initialEdits={edits} strip={strip} title={title} mode={eventProfile ? "event" : "solo"} retentionHours={eventProfile?.retentionHours} onEditsChange={setEdits} onRetake={(index) => void retake(index)} />
      <div className={styles.finishActions}><button className="button buttonPrimary" type="button" onClick={download} disabled={!strip}><Download size={18} /> Download PNG</button><button className="button buttonSecondary" type="button" onClick={() => void share()} disabled={!strip}><Share2 size={18} /> Share</button><button className="button buttonSecondary" type="button" onClick={() => void save()} disabled={!strip}><Images size={18} /> Save to gallery</button></div>
      {message && <p className={styles.message} role="status">{message}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
    </div>}
  </section>;
}

function StripPreview({ strip, theme }: { strip: string | null; theme: StripThemeId }) {
  return <div className={styles.stripPreview} aria-live="polite">{strip ? <img src={strip} alt={`Completed strip in the ${stripThemes[theme].label} frame`} /> : <LoaderCircle className={styles.spinner} aria-label="Rendering your JoyShot" />}</div>;
}

function CaptureScreen({ camera, videoRef, flash, countdown, shotIndex, photos, muted, onMute }: { camera: ReturnType<typeof useCamera>; videoRef: React.RefObject<HTMLVideoElement | null>; flash: boolean; countdown: number | null; shotIndex: number; photos: string[]; muted: boolean; onMute: () => void }) {
  return <div className={styles.captureScreen}><header><span>Photo {shotIndex + 1} of 4</span><button type="button" onClick={onMute} aria-label={muted ? "Turn sound on" : "Mute sound"}>{muted ? <VolumeX /> : <Volume2 />}</button></header><div className={styles.captureCamera}><CameraPreview flash={flash} mirrored={camera.mirrored} status={camera.status} stream={camera.stream} videoRef={videoRef} /><div className={styles.countdown} aria-live="assertive" aria-atomic="true"><strong key={`${shotIndex}-${countdown}`}>{countdown ?? "Nice"}</strong><span>{promptForShot(shotIndex)}</span></div></div><div className={styles.captureDots}>{[0, 1, 2, 3].map((index) => <i key={index} className={index < photos.length ? styles.capturedDot : index === shotIndex ? styles.currentDot : ""}>{index + 1}</i>)}</div></div>;
}
