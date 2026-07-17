"use client";

import { Camera, CameraOff, CheckCircle2 } from "lucide-react";
import { useEffect, type RefObject } from "react";
import type { CameraStatus } from "@/features/camera/useCamera";
import styles from "./CameraPreview.module.css";

interface CameraPreviewProps {
  flash: boolean;
  status: CameraStatus;
  stream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function CameraPreview({ flash, status, stream, videoRef }: CameraPreviewProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) void video.play().catch(() => undefined);
  }, [stream, videoRef]);

  return (
    <div className={styles.shell}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted
        playsInline
        aria-label="Live preview from your camera"
      />
      {!stream && (
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon} aria-hidden="true">
            {status === "error" ? <CameraOff size={32} /> : <Camera size={32} />}
          </span>
          <strong>{status === "requesting" ? "Starting your camera..." : "Your preview appears here"}</strong>
          <span>Nothing is recorded or uploaded.</span>
        </div>
      )}
      <div className={styles.label}>
        {status === "ready" ? <CheckCircle2 size={17} aria-hidden="true" /> : <Camera size={17} aria-hidden="true" />}
        <span>{status === "ready" ? "You · Camera ready" : "You · Camera off"}</span>
      </div>
      <div className={`${styles.flash} ${flash ? styles.flashActive : ""}`} aria-hidden="true" />
    </div>
  );
}
