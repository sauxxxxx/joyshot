"use client";

import type { BoothSettings } from "@photobooth/shared";
import { ArrowLeft, ArrowRight, Camera, Check, Download, Images, LoaderCircle, RefreshCcw, Share2, ShieldCheck, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPreview } from "@/components/camera/CameraPreview";
import { captureFrame } from "@/features/camera/captureFrame";
import { CameraControls } from "@/features/camera/CameraControls";
import { useCamera } from "@/features/camera/useCamera";
import { readEventProfile, type EventProfile } from "@/features/event/eventProfile";
import { saveGalleryItem } from "@/features/gallery/galleryStore";
import { shareImage } from "@/features/sharing/shareMedia";
import { BoothSettingsPicker } from "@/features/strip/BoothSettingsPicker";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import { promptForShot } from "@/features/session/posePrompts";
import styles from "./SoloBooth.module.css";

type BoothStep = "camera" | "style" | "settings" | "capture" | "review" | "customize" | "result";
const steps: Array<{ id: BoothStep; label: string }> = [
  { id: "camera", label: "Camera" }, { id: "style", label: "Style" },
  { id: "settings", label: "Setup" }, { id: "capture", label: "Capture" },
  { id: "review", label: "Review" }, { id: "customize", label: "Customize" },
  { id: "result", label: "Finish" },
];
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function SoloBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelledRef = useRef(false);
  const camera = useCamera();
  const [step, setStep] = useState<BoothStep>("camera");
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [settings, setSettings] = useState<BoothSettings>({ countdownSeconds: 5, layout: "strip" });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [strip, setStrip] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("JoyShot");
  const [caption, setCaption] = useState("");
  const [eventProfile, setEventProfile] = useState<EventProfile | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("event") !== "1") return;
    const profile = readEventProfile();
    if (profile) { setEventProfile(profile); setTitle(profile.name); setCaption(profile.caption); }
  }, []);
  useEffect(() => () => { cancelledRef.current = true; }, []);
  useEffect(() => {
    if (photos.length !== 4 || (step !== "customize" && step !== "result")) return;
    let active = true;
    setStrip(null);
    void drawSoloStrip(photos, theme, settings.layout, {
      title, caption, logoSource: eventProfile?.logoSource, brandColor: eventProfile?.brandColor,
    }).then((image) => active && setStrip(image))
      .catch(() => active && setError("We could not render that design. Try another style."));
    return () => { active = false; };
  }, [caption, eventProfile, photos, settings.layout, step, theme, title]);
  useEffect(() => {
    if (step !== "capture" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock.request("screen").then((next) => { lock = next; }).catch(() => undefined);
    return () => { void lock?.release(); };
  }, [step]);

  const playTone = useCallback((frequency: number, duration: number) => {
    if (muted || !window.AudioContext) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration / 1000);
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
    cancelledRef.current = false; setError(null); setPhotos([]); setStrip(null); setStep("capture");
    try {
      const captures: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        const photo = await takeFrame(index);
        captures.push(photo); setPhotos([...captures]);
        if (index < 3) await wait(700);
      }
      setPhotos(captures); setStep("review");
    } catch (captureError) {
      if (!cancelledRef.current) setError(captureError instanceof Error ? captureError.message : "Capture failed.");
      setStep("settings");
    }
  }, [camera.status, takeFrame]);
  const retake = useCallback(async (index: number) => {
    cancelledRef.current = false; setError(null); setStep("capture");
    try {
      const photo = await takeFrame(index);
      setPhotos((current) => current.map((item, itemIndex) => itemIndex === index ? photo : item));
      setStep("review");
    } catch (captureError) {
      if (!cancelledRef.current) setError(captureError instanceof Error ? captureError.message : "Retake failed.");
      setStep("review");
    }
  }, [takeFrame]);
  const reset = () => {
    cancelledRef.current = true; setPhotos([]); setStrip(null); setCountdown(null);
    setError(null); setMessage(null); setStep("camera");
  };
  const download = () => {
    if (!strip) return;
    const anchor = document.createElement("a"); anchor.href = strip;
    anchor.download = `joyshot-${Date.now()}.png`; anchor.click();
  };
  const share = async () => {
    if (!strip) return;
    const shared = await shareImage(strip, "joyshot.png", title);
    if (!shared) { download(); setMessage("Sharing is unavailable here, so we downloaded your JoyShot instead."); }
  };
  const save = async () => {
    if (!strip) return;
    await saveGalleryItem(strip, title, eventProfile ? "event" : "solo", eventProfile?.retentionHours);
    setMessage("Saved privately to your gallery on this device.");
  };

  const currentStep = steps.findIndex(({ id }) => id === step);
  return <section className={`${styles.booth} ${step === "capture" ? styles.immersive : ""}`} aria-labelledby="booth-title">
    {step !== "capture" && <nav className={styles.progressNav} aria-label="Booth progress">
      {steps.filter(({ id }) => id !== "capture").map((item) => {
        const index = steps.findIndex(({ id }) => id === item.id);
        return <span key={item.id} className={index === currentStep ? styles.activeStep : index < currentStep ? styles.doneStep : ""}>
          <i>{index < currentStep ? <Check size={13} /> : index + 1}</i>{item.label}
        </span>;
      })}
    </nav>}
    {step === "camera" && <SetupScreen title={eventProfile?.name} camera={camera} videoRef={videoRef} flash={flash} onContinue={() => setStep("style")} />}
    {step === "style" && <div className={styles.flowScreen}>
      <FlowHeading eyebrow="Step 2" title="Choose your vibe." text="Pick a starting point. You can change it again after your photos are taken." />
      <StripThemePicker onChange={setTheme} value={theme} />
      <FlowActions back={() => setStep("camera")} next={() => setStep("settings")} nextLabel="Continue to setup" />
    </div>}
    {step === "settings" && <div className={styles.flowScreen}>
      <FlowHeading eyebrow="Step 3" title="A couple of small choices." text="Choose your pace and final format, then the booth takes over." />
      <div className={styles.settingsCard}><BoothSettingsPicker settings={settings} onChange={setSettings} /></div>
      <FlowActions back={() => setStep("style")} next={() => void startSession()} nextLabel="Start booth" camera />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>}
    {step === "capture" && <CaptureScreen camera={camera} videoRef={videoRef} flash={flash} countdown={countdown} shotIndex={shotIndex} photos={photos} muted={muted} onMute={() => setMuted((value) => !value)} />}
    {step === "review" && <div className={styles.flowScreen}>
      <FlowHeading eyebrow="Four poses captured" title="Keep the ones you love." text="Retake just one photo—there is no need to start the whole booth again." />
      <div className={styles.reviewGrid}>{photos.map((photo, index) => <article key={`${photo.slice(-18)}-${index}`}>
        <img src={photo} alt={`Pose ${index + 1}`} /><div><strong>Pose {index + 1}</strong>
        <button type="button" onClick={() => void retake(index)}><RefreshCcw size={16} /> Retake</button></div>
      </article>)}</div>
      <FlowActions back={() => { setPhotos([]); setStep("settings"); }} next={() => setStep("customize")} nextLabel="Looks good" />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>}
    {step === "customize" && <div className={styles.flowScreen}>
      <FlowHeading eyebrow="Make it yours" title="Now for the finishing touch." text="Style your real photos and watch the keepsake update." />
      <div className={styles.customizeGrid}><div className={styles.customizeControls}>
        <StripThemePicker label="Frame style" onChange={setTheme} value={theme} />
        <BoothSettingsPicker settings={settings} onChange={setSettings} showTimer={false} />
        <div className={styles.textOptions}><label>Title<input maxLength={34} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Caption<input maxLength={64} value={caption} placeholder="Our Sunday 🤍" onChange={(event) => setCaption(event.target.value)} /></label></div>
      </div><StripPreview strip={strip} theme={theme} /></div>
      <FlowActions back={() => setStep("review")} next={() => setStep("result")} nextLabel="Finish my JoyShot" disabled={!strip} />
    </div>}
    {step === "result" && <div className={styles.result}>
      <div className={styles.celebration}><span><Sparkles size={18} /> Ready to keep</span><h1 id="booth-title">Your JoyShot is ready.</h1>
        <p>Made in your browser, ready for wherever the moment goes next.</p></div>
      <StripPreview strip={strip} theme={theme} />
      <div className={styles.resultActions}>
        <button className="button buttonPrimary" type="button" onClick={download} disabled={!strip}><Download size={19} /> Download photo</button>
        <button className="button buttonSecondary" type="button" onClick={() => void share()} disabled={!strip}><Share2 size={19} /> Share</button>
        <button className="button buttonSecondary" type="button" onClick={() => void save()} disabled={!strip}><Images size={19} /> Save to gallery</button>
        <button className="button buttonGhost" type="button" onClick={() => setStep("customize")}><ArrowLeft size={18} /> Edit design</button>
        <button className="button buttonGhost" type="button" onClick={reset}><RefreshCcw size={18} /> Take another strip</button>
      </div>{message && <p className={styles.message} role="status">{message}</p>}
    </div>}
  </section>;
}

function FlowHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <header className={styles.flowHeading}><span>{eyebrow}</span><h1 id="booth-title">{title}</h1><p>{text}</p></header>;
}
function FlowActions({ back, next, nextLabel, camera, disabled }: { back: () => void; next: () => void; nextLabel: string; camera?: boolean; disabled?: boolean }) {
  return <div className={styles.flowActions}><button className="button buttonGhost" type="button" onClick={back}><ArrowLeft size={18} /> Back</button>
    <button className="button buttonPrimary" type="button" onClick={next} disabled={disabled}>{camera ? <Camera size={19} /> : null}{nextLabel}<ArrowRight size={18} /></button></div>;
}
function StripPreview({ strip, theme }: { strip: string | null; theme: StripThemeId }) {
  return <div className={styles.stripPreview} aria-live="polite">{strip
    ? <img src={strip} alt={`Completed strip in the ${stripThemes[theme].label} theme`} />
    : <LoaderCircle className={styles.spinner} aria-label="Rendering your JoyShot" />}</div>;
}
function SetupScreen({ title, camera, videoRef, flash, onContinue }: {
  title?: string; camera: ReturnType<typeof useCamera>; videoRef: React.RefObject<HTMLVideoElement | null>; flash: boolean; onContinue: () => void;
}) {
  return <div className={styles.flowScreen}><FlowHeading eyebrow={title ? `${title} guest booth` : "Step 1"}
    title={title ? `Welcome to ${title}.` : "Get your camera ready."}
    text={title ? "Step in, line up your shot, and make a keepsake." : "Your camera is only used while you take photos. Nothing is uploaded in solo mode."} />
    <div className={styles.cameraSetup}><div><CameraPreview flash={flash} mirrored={camera.mirrored} status={camera.status} stream={camera.stream} videoRef={videoRef} /></div>
      <aside><div className={styles.cameraNote}><ShieldCheck size={21} /><div><strong>Private by design</strong><span>Your camera and photos stay on this device.</span></div></div>
      {camera.status === "ready" && <CameraControls devices={camera.devices} mirrored={camera.mirrored} selectedDeviceId={camera.selectedDeviceId}
        onFlip={() => void camera.flipCamera()} onMirrorChange={camera.setMirrored} onSelect={(id) => void camera.selectDevice(id)} />}
      {camera.status !== "ready" ? <button className="button buttonPrimary" type="button" onClick={() => void camera.start()} disabled={camera.status === "requesting"}>
        {camera.status === "requesting" ? <LoaderCircle className={styles.spinner} /> : <Camera size={19} />}{camera.status === "requesting" ? "Starting camera..." : camera.status === "error" ? "Try camera again" : "Enable camera"}</button>
        : <button className="button buttonPrimary" type="button" onClick={onContinue}>Camera looks good <ArrowRight size={18} /></button>}
      {camera.error && <p className={styles.error} role="alert">{camera.error}</p>}</aside></div>
  </div>;
}
function CaptureScreen({ camera, videoRef, flash, countdown, shotIndex, photos, muted, onMute }: {
  camera: ReturnType<typeof useCamera>; videoRef: React.RefObject<HTMLVideoElement | null>; flash: boolean; countdown: number | null;
  shotIndex: number; photos: string[]; muted: boolean; onMute: () => void;
}) {
  return <div className={styles.captureScreen}><header><span>Pose {shotIndex + 1} of 4</span><button type="button" onClick={onMute} aria-label={muted ? "Turn sound on" : "Mute sound"}>{muted ? <VolumeX /> : <Volume2 />}</button></header>
    <div className={styles.captureCamera}><CameraPreview flash={flash} mirrored={camera.mirrored} status={camera.status} stream={camera.stream} videoRef={videoRef} />
      <div className={styles.countdown} aria-live="assertive" aria-atomic="true"><strong key={`${shotIndex}-${countdown}`}>{countdown ?? "Nice!"}</strong><span>{promptForShot(shotIndex)}</span></div></div>
    <div className={styles.captureDots}>{[0, 1, 2, 3].map((index) => <i key={index} className={index < photos.length ? styles.capturedDot : index === shotIndex ? styles.currentDot : ""}>{index + 1}</i>)}</div>
  </div>;
}
