"use client";

import type { BoothSettings } from "@photobooth/shared";
import { Camera, Check, Download, LoaderCircle, RefreshCcw, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPreview } from "@/components/camera/CameraPreview";
import { captureFrame } from "@/features/camera/captureFrame";
import { useCamera } from "@/features/camera/useCamera";
import { drawSoloStrip } from "@/features/strip/drawSoloStrip";
import { BoothSettingsPicker } from "@/features/strip/BoothSettingsPicker";
import { StripThemePicker } from "@/features/strip/StripThemePicker";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import styles from "./SoloBooth.module.css";

type BoothPhase = "setup" | "countdown" | "processing" | "complete";
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function SoloBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelledRef = useRef(false);
  const { error: cameraError, start: startCamera, status: cameraStatus, stream } = useCamera();
  const [phase, setPhase] = useState<BoothPhase>("setup");
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [settings, setSettings] = useState<BoothSettings>({ countdownSeconds: 5, layout: "strip" });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [strip, setStrip] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  useEffect(() => {
    if (photos.length !== 4 || phase !== "complete") return;
    let active = true;
    setStrip(null);
    void drawSoloStrip(photos, theme, settings.layout)
      .then((nextStrip) => active && setStrip(nextStrip))
      .catch(() => active && setSessionError("We could not redraw that theme. Try another one."));
    return () => {
      active = false;
    };
  }, [photos, theme, settings.layout, phase]);

  const playTone = useCallback((frequency: number, duration: number) => {
    if (muted) return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration / 1000);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration / 1000);
    oscillator.addEventListener("ended", () => void audio.close());
  }, [muted]);

  const startSession = useCallback(async () => {
    if (!videoRef.current || cameraStatus !== "ready") return;
    cancelledRef.current = false;
    setSessionError(null);
    setPhotos([]);
    setStrip(null);
    setPhase("countdown");

    try {
      const captures: string[] = [];
      for (let shot = 0; shot < 4; shot += 1) {
        if (cancelledRef.current) return;
        setShotIndex(shot);
        for (let count = settings.countdownSeconds; count >= 1; count -= 1) {
          setCountdown(count);
          if (count <= 3) playTone(520 + (3 - count) * 90, 120);
          await wait(1000);
          if (cancelledRef.current) return;
        }
        setCountdown(null);
        setFlash(true);
        playTone(880, 180);
        captures.push(captureFrame(videoRef.current, { mirror: true }));
        setPhotos([...captures]);
        await wait(380);
        setFlash(false);
        if (shot < 3) await wait(850);
      }

      setPhase("processing");
      const result = await drawSoloStrip(captures, theme, settings.layout);
      if (cancelledRef.current) return;
      setStrip(result);
      setPhase("complete");
    } catch (captureError) {
      setSessionError(captureError instanceof Error ? captureError.message : "The session could not be completed.");
      setPhase("setup");
    }
  }, [cameraStatus, playTone, settings, theme]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setPhase("setup");
    setPhotos([]);
    setStrip(null);
    setCountdown(null);
    setSessionError(null);
  }, []);

  const download = useCallback(() => {
    if (!strip) return;
    const anchor = document.createElement("a");
    anchor.href = strip;
    anchor.download = `joyshot-photo-strip-${Date.now()}.png`;
    anchor.click();
  }, [strip]);

  if (phase === "complete") {
    return (
      <section className={styles.result} aria-labelledby="result-title">
        <div className={styles.resultCopy}>
          <span className="eyebrow"><Check size={17} /> Four poses captured</span>
          <h1 id="result-title">Your strip is ready.</h1>
          <p>Pick the frame that feels right, then save the full-resolution PNG to your device.</p>
          <StripThemePicker onChange={setTheme} value={theme} />
          <BoothSettingsPicker settings={settings} onChange={setSettings} showTimer={false} />
          <div className={styles.resultActions}>
            <button className="button buttonPrimary" type="button" onClick={download} disabled={!strip}>
              {strip ? <Download size={20} /> : <LoaderCircle className={styles.spinner} size={20} />}
              {strip ? "Download PNG" : "Rendering theme..."}
            </button>
            <button className="button buttonSecondary" type="button" onClick={reset}>
              <RefreshCcw size={19} /> Take another
            </button>
          </div>
          {sessionError && <p className={styles.error} role="alert">{sessionError}</p>}
        </div>
        <div className={styles.stripPreview} aria-live="polite">
          {strip ? <img src={strip} alt={`Completed four-photo strip in the ${stripThemes[theme].label} theme`} /> : <LoaderCircle className={styles.largeSpinner} aria-label="Rendering photo strip" />}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.booth} aria-labelledby="booth-title">
      <div className={styles.copy}>
        <span className="eyebrow"><Camera size={17} /> Solo booth</span>
        <h1 id="booth-title">Four poses. One classic strip.</h1>
        <p>Set your camera at eye level, choose your timer and layout, then get ready for four photos.</p>
      </div>

      <div className={styles.workspace}>
        <div className={styles.cameraColumn}>
          <CameraPreview flash={flash} status={cameraStatus} stream={stream} videoRef={videoRef} />
          {phase === "countdown" && (
            <div className={styles.countdownOverlay} aria-live="assertive" aria-atomic="true">
              <span className={styles.progress}>Photo {shotIndex + 1} of 4</span>
              <strong key={`${shotIndex}-${countdown}`}>{countdown ?? "Smile!"}</strong>
              <span>Look at the camera</span>
            </div>
          )}
          <div className={styles.thumbnails} aria-label={`${photos.length} of 4 photos captured`}>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={photos[index] ? styles.thumbnailComplete : ""}>
                {photos[index] ? <img src={photos[index]} alt={`Captured pose ${index + 1}`} /> : <span>{index + 1}</span>}
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.controls} aria-label="Booth controls">
          <div className={styles.controlHeading}>
            <div><span>Session setup</span><strong>{cameraStatus === "ready" ? "Ready to shoot" : "Camera needed"}</strong></div>
            <button className={styles.soundButton} type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Turn countdown sound on" : "Mute countdown sound"}>
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          <div className={styles.checklist}>
            <div className={cameraStatus === "ready" ? styles.checked : ""}><span><Camera size={18} /> Camera access</span>{cameraStatus === "ready" && <Check size={18} />}</div>
            <div className={styles.checked}><span><ShieldCheck size={18} /> Local processing</span><Check size={18} /></div>
          </div>
          <StripThemePicker label="Pick your starting style" onChange={setTheme} value={theme} />
          <BoothSettingsPicker settings={settings} onChange={setSettings} />
          {cameraStatus !== "ready" ? (
            <button className="button buttonPrimary" type="button" onClick={() => void startCamera()} disabled={cameraStatus === "requesting"}>
              {cameraStatus === "requesting" ? <LoaderCircle className={styles.spinner} size={20} /> : <Camera size={20} />}
              {cameraStatus === "requesting" ? "Starting camera..." : cameraStatus === "error" ? "Try camera again" : "Allow camera"}
            </button>
          ) : (
            <button className="button buttonPrimary" type="button" onClick={() => void startSession()} disabled={phase !== "setup"}>
              <Camera size={20} /> Start four photos
            </button>
          )}
          {(cameraError || sessionError) && <p className={styles.error} role="alert">{cameraError ?? sessionError}</p>}
          <p className={styles.privacy}><ShieldCheck size={17} /> Your solo photos stay in this browser and disappear when you close or refresh the page.</p>
        </aside>
      </div>

      {phase === "processing" && (
        <div className={styles.processing} role="status"><LoaderCircle className={styles.spinner} size={24} /> Making your photo strip...</div>
      )}
    </section>
  );
}
