"use client";

import { Camera, Check, Clipboard, DoorOpen, Download, LoaderCircle, RefreshCcw, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoomVideoGrid } from "@/components/room/RoomVideoGrid";
import { captureFrame, dataUrlToArrayBuffer } from "@/features/camera/captureFrame";
import { useCamera } from "@/features/camera/useCamera";
import { drawCombinedStrip } from "@/features/strip/drawCombinedStrip";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import { usePeerVideo } from "@/features/webrtc/usePeerVideo";
import { useRoom } from "./useRoom";
import styles from "./RoomBooth.module.css";

export function RoomBooth({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const capturedScheduleRef = useRef<string | null>(null);
  const roomState = useRoom(roomCode);
  const camera = useCamera();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [pairs, setPairs] = useState<Array<string[] | undefined>>([]);
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [strip, setStrip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const self = roomState.room?.participants.find((item) => item.id === roomState.membership?.participantId);
  const partner = roomState.room?.participants.find((item) => item.id !== roomState.membership?.participantId);
  const peer = usePeerVideo({
    localStream: camera.stream,
    participantId: roomState.membership?.participantId,
    participants: roomState.room?.participants ?? [],
    role: roomState.membership?.role,
    roomCode,
    socket: roomState.socket,
  });

  useEffect(() => {
    if (!roomState.membership) return;
    roomState.updatePresence({ cameraReady: camera.status === "ready" });
  }, [camera.status, roomState.membership, roomState.updatePresence]);

  useEffect(() => {
    const pair = roomState.latestPair;
    if (!pair) return;
    const urls = pair.images.map(({ image }) => URL.createObjectURL(new Blob([image], { type: "image/jpeg" })));
    setPairs((current) => {
      const next = [...current];
      next[pair.shotIndex] = urls;
      return next;
    });
  }, [roomState.latestPair]);

  useEffect(() => {
    const schedule = roomState.schedule;
    if (!schedule || !localVideoRef.current || camera.status !== "ready") return;
    const scheduleKey = `${schedule.sessionId}:${schedule.shotIndex}`;
    if (capturedScheduleRef.current === scheduleKey) return;
    if (schedule.shotIndex === 0) {
      setPairs([]);
      setStrip(null);
      setRenderError(null);
    }
    const updateCountdown = () => {
      const remaining = schedule.captureAt - (Date.now() + roomState.serverOffset);
      setCountdown(remaining > 0 ? Math.min(3, Math.max(1, Math.ceil(remaining / 1000))) : null);
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 100);
    const delay = Math.max(0, schedule.captureAt - (Date.now() + roomState.serverOffset));
    const timeout = window.setTimeout(() => {
      capturedScheduleRef.current = scheduleKey;
      setCountdown(null);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 380);
      try {
        const image = dataUrlToArrayBuffer(captureFrame(localVideoRef.current!, { mirror: true, quality: 0.78 }));
        roomState.submitCapture({ sessionId: schedule.sessionId, shotIndex: schedule.shotIndex, image });
      } catch (error) {
        setRenderError(error instanceof Error ? error.message : "Your photo could not be captured.");
      }
    }, delay);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [camera.status, roomState.schedule, roomState.serverOffset, roomState.submitCapture]);

  const completePairs = useMemo(() => pairs.filter((pair): pair is string[] => Boolean(pair)), [pairs]);
  useEffect(() => {
    if (!roomState.completion || completePairs.length !== 4) return;
    setStrip(null);
    let active = true;
    void drawCombinedStrip(completePairs, theme)
      .then((result) => active && setStrip(result))
      .catch((error) => active && setRenderError(error instanceof Error ? error.message : "The strip could not be rendered."));
    return () => { active = false; };
  }, [completePairs, roomState.completion, theme]);

  const copyRoom = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  const download = () => {
    if (!strip) return;
    const anchor = document.createElement("a");
    anchor.href = strip;
    anchor.download = `joyshot-together-${roomCode}.png`;
    anchor.click();
  };

  const leave = () => {
    roomState.leave();
    camera.stop();
    router.push("/room");
  };

  if (roomState.status === "connecting") return <RoomMessage title="Opening your private booth" text="Connecting securely to the room..." loading />;
  if (roomState.status === "error" || !roomState.room || !roomState.membership) {
    return <RoomMessage title="This booth is unavailable" text={roomState.error ?? "The room could not be opened."} action={() => router.push("/room")} />;
  }

  const isHost = roomState.membership.role === "host";
  const canStart = isHost && roomState.room.status === "ready";
  const sessionActive = roomState.room.status === "countdown" || roomState.room.status === "capturing";

  if (roomState.completion && completePairs.length === 4) {
    return (
      <section className={styles.result} aria-labelledby="room-result-title">
        <div className={styles.resultCopy}>
          <span className="eyebrow"><Check size={17} /> Both photo sets received</span>
          <h1 id="room-result-title">Your moment, together.</h1>
          <p>Both people receive the same ordered photos. Pick a frame and download your copy.</p>
          <fieldset className={styles.themes}><legend>Photo strip theme</legend>{Object.entries(stripThemes).map(([id, option]) => (
            <label className={theme === id ? styles.themeActive : ""} key={id}><input type="radio" name="room-theme" checked={theme === id} onChange={() => setTheme(id as StripThemeId)} />{option.label}</label>
          ))}</fieldset>
          <div className={styles.resultActions}>
            <button className="button buttonPrimary" type="button" onClick={download} disabled={!strip}>{strip ? <Download size={20} /> : <LoaderCircle className={styles.spinner} size={20} />}{strip ? "Download PNG" : "Rendering..."}</button>
            {isHost ? <button className="button buttonSecondary" type="button" onClick={() => void roomState.startSession()}><RefreshCcw size={19} /> Take another</button> : <span className={styles.waitingText}>Waiting for host to start another</span>}
          </div>
          <button className="button buttonGhost" type="button" onClick={leave}><DoorOpen size={19} /> Leave room</button>
        </div>
        <div className={styles.stripPreview}>{strip ? <img src={strip} alt={`Combined four-pair strip in the ${stripThemes[theme].label} theme`} /> : <LoaderCircle className={styles.largeSpinner} />}</div>
      </section>
    );
  }

  return (
    <section className={styles.room} aria-labelledby="room-title">
      <header className={styles.roomHeader}>
        <div><span className="eyebrow"><UsersRound size={17} /> Private booth</span><h1 id="room-title">Room {roomCode}</h1></div>
        <div className={styles.headerActions}><button className="button buttonSecondary" type="button" onClick={() => void copyRoom()}><Clipboard size={18} />{copied ? "Link copied" : "Copy invite"}</button><button className="button buttonGhost" type="button" onClick={leave}><DoorOpen size={18} /> Leave</button></div>
      </header>

      <div className={styles.videoArea}>
        <RoomVideoGrid flash={flash} localReady={Boolean(self?.ready)} localStream={camera.stream} localVideoRef={localVideoRef}
          partnerConnected={Boolean(partner?.connected)} partnerReady={Boolean(partner?.ready)} remoteStream={peer.remoteStream} />
        {sessionActive && <div className={styles.countdown} aria-live="assertive"><span>Photo {(roomState.room.session?.currentShotIndex ?? 0) + 1} of 4</span><strong>{countdown ?? "Smile!"}</strong><small>Both devices capture together</small></div>}
      </div>

      <div className={styles.progressRow} aria-label={`${completePairs.length} of 4 photo pairs received`}>
        {[0, 1, 2, 3].map((index) => <div className={pairs[index] ? styles.pairComplete : ""} key={index}>{pairs[index] ? <Check size={17} /> : index + 1}<span>Pair {index + 1}</span></div>)}
      </div>

      <aside className={styles.controlBar}>
        <div className={styles.statusGroup}><Status label="You" connected cameraReady={Boolean(self?.cameraReady)} ready={Boolean(self?.ready)} /><Status label="Partner" connected={Boolean(partner?.connected)} cameraReady={Boolean(partner?.cameraReady)} ready={Boolean(partner?.ready)} /></div>
        <div className={styles.primaryControls}>
          {camera.status !== "ready" ? <button className="button buttonPrimary" type="button" onClick={() => void camera.start()} disabled={camera.status === "requesting"}>{camera.status === "requesting" ? <LoaderCircle className={styles.spinner} size={20} /> : <Camera size={20} />}{camera.status === "requesting" ? "Starting camera..." : "Allow camera"}</button> : <button className="button buttonSecondary" type="button" onClick={() => roomState.updatePresence({ ready: !self?.ready })} disabled={sessionActive}>{self?.ready ? <><Check size={20} /> Ready</> : "I'm ready"}</button>}
          {isHost ? <button className="button buttonPrimary" type="button" onClick={() => void roomState.startSession()} disabled={!canStart || sessionActive}><Camera size={20} /> Start four photos</button> : <span className={styles.waitingText}>{roomState.room.status === "ready" ? "Waiting for host to start" : "Get both cameras ready"}</span>}
        </div>
      </aside>
      {(camera.error || roomState.error || renderError) && <p className={styles.error} role="alert">{camera.error ?? roomState.error ?? renderError}</p>}
    </section>
  );
}

function Status({ label, connected, cameraReady, ready }: { label: string; connected: boolean; cameraReady: boolean; ready: boolean }) {
  const text = !connected ? "Offline" : ready ? "Ready" : cameraReady ? "Camera on" : "Camera needed";
  return <div className={ready ? styles.statusReady : ""}><span>{label}</span><strong><i aria-hidden="true" />{text}</strong></div>;
}

function RoomMessage({ title, text, loading, action }: { title: string; text: string; loading?: boolean; action?: () => void }) {
  return <section className={styles.message}>{loading ? <LoaderCircle className={styles.largeSpinner} /> : <UsersRound size={40} />}<h1>{title}</h1><p>{text}</p>{action && <button className="button buttonPrimary" onClick={action}>Back to rooms</button>}</section>;
}
