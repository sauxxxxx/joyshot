"use client";

import { Camera, CameraOff } from "lucide-react";
import { useEffect, type RefObject } from "react";
import type { CameraStatus } from "@/features/camera/useCamera";
import styles from "./CameraPreview.module.css";

interface CameraPreviewProps { flash: boolean; status: CameraStatus; stream: MediaStream | null; videoRef: RefObject<HTMLVideoElement | null>; mirrored?: boolean; }

export function CameraPreview({ flash, status, stream, videoRef, mirrored = true }: CameraPreviewProps) {
  useEffect(() => { const video = videoRef.current; if (!video) return; video.srcObject = stream; if (stream) void video.play().catch(() => undefined); }, [stream, videoRef]);
  return <div className={styles.shell}>
    <header><span>JOYSHOT VIEWFINDER</span><b>{status === "ready" ? "LIVE" : "STANDBY"}</b></header>
    <div className={styles.view}>
      <video ref={videoRef} className={`${styles.video} ${mirrored ? "" : styles.notMirrored}`} autoPlay muted playsInline aria-label="Live preview from your camera" />
      {!stream && <div className={styles.placeholder}><span className={styles.placeholderIcon} aria-hidden="true">{status === "error" ? <CameraOff size={29} /> : <Camera size={29} />}</span><strong>{status === "requesting" ? "Opening the lens..." : status === "error" ? "The lens needs permission" : "Preparing the lens"}</strong><span>{status === "error" ? "Allow Camera in your browser settings, then try again." : "Chrome may ask you to allow camera access."}</span></div>}
      <i className={styles.focusFrame} aria-hidden="true" />
      <div className={styles.label}><i aria-hidden="true" /><span>{status === "ready" ? "CAMERA READY" : status === "requesting" ? "CONNECTING" : "CAMERA OFF"}</span></div>
      <div className={`${styles.flash} ${flash ? styles.flashActive : ""}`} aria-hidden="true" />
    </div>
    <footer><span>ISO 400</span><span>F 2.8</span><span>1/60</span><span>{mirrored ? "MIRROR" : "NORMAL"}</span></footer>
  </div>;
}
