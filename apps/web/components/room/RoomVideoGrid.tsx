"use client";

import { Camera, CheckCircle2, UserRound, WifiOff } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import styles from "./RoomVideoGrid.module.css";

interface RoomVideoGridProps {
  flash: boolean;
  localReady: boolean;
  localStream: MediaStream | null;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  partnerConnected: boolean;
  partnerReady: boolean;
  remoteStream: MediaStream | null;
}

function RemoteVideo({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline aria-label="Live preview from your partner's camera" />;
}

export function RoomVideoGrid(props: RoomVideoGridProps) {
  useEffect(() => {
    if (!props.localVideoRef.current) return;
    props.localVideoRef.current.srcObject = props.localStream;
    if (props.localStream) void props.localVideoRef.current.play().catch(() => undefined);
  }, [props.localStream, props.localVideoRef]);

  return (
    <div className={styles.grid}>
      <div className={styles.videoCard}>
        {props.localStream ? <video className={styles.localVideo} ref={props.localVideoRef} autoPlay muted playsInline aria-label="Your live camera preview" /> : (
          <div className={styles.placeholder}><Camera size={34} /><strong>Your camera</strong><span>Allow access to appear here.</span></div>
        )}
        <div className={styles.videoLabel}>{props.localReady ? <CheckCircle2 size={17} /> : <Camera size={17} />} You · {props.localReady ? "Ready" : "Setting up"}</div>
        <div className={`${styles.flash} ${props.flash ? styles.flashActive : ""}`} />
      </div>
      <div className={styles.videoCard}>
        {props.remoteStream ? <RemoteVideo stream={props.remoteStream} /> : (
          <div className={styles.placeholder}>
            {props.partnerConnected ? <UserRound size={34} /> : <WifiOff size={34} />}
            <strong>{props.partnerConnected ? "Connecting partner video" : "Waiting for your person"}</strong>
            <span>{props.partnerConnected ? "The photo session can continue if live video is unavailable." : "Share the private room code with them."}</span>
          </div>
        )}
        <div className={`${styles.videoLabel} ${styles.partnerLabel}`}>{props.partnerReady ? <CheckCircle2 size={17} /> : <UserRound size={17} />} Partner · {props.partnerReady ? "Ready" : props.partnerConnected ? "Connected" : "Offline"}</div>
        <div className={`${styles.flash} ${props.flash ? styles.flashActive : ""}`} />
      </div>
    </div>
  );
}
