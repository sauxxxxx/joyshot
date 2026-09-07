"use client";

import { Camera, Check, Clipboard, DoorOpen, Download, Heart, LoaderCircle, Lock, LockOpen, PartyPopper, RefreshCcw, Sparkles, UserMinus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoomVideoGrid } from "@/components/room/RoomVideoGrid";
import { captureFrame, dataUrlToArrayBuffer } from "@/features/camera/captureFrame";
import { CameraControls } from "@/features/camera/CameraControls";
import { useCamera } from "@/features/camera/useCamera";
import { ResultExperience } from "@/features/editor/ResultExperience";
import type { BoothSettings } from "@photobooth/shared";
import { createPhotoEdit, type PhotoEdit } from "@/features/editor/photoEdits";
import { InviteCard } from "@/features/sharing/InviteCard";
import { drawCombinedStrip } from "@/features/strip/drawCombinedStrip";
import { BoothSettingsPicker } from "@/features/strip/BoothSettingsPicker";
import { stripThemes, type StripThemeId } from "@/features/strip/stripThemes";
import { promptForShot } from "@/features/session/posePrompts";
import { usePeerVideo } from "@/features/webrtc/usePeerVideo";
import { useRoom } from "./useRoom";
import styles from "./RoomBooth.module.css";

export function RoomBooth({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const capturedScheduleRef = useRef<string | null>(null);
  const roomState = useRoom(roomCode);
  const camera = useCamera({ autoStart: roomState.status === "joined" && !roomState.completion });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [pairs, setPairs] = useState<Array<string[] | undefined>>([]);
  const [theme, setTheme] = useState<StripThemeId>("classic");
  const [strip, setStrip] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [resultSettings, setResultSettings] = useState<BoothSettings>({ countdownSeconds: 3, layout: "strip" });
  const [renderVersion, setRenderVersion] = useState(0);
  const pairUrls = useRef<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [edits, setEdits] = useState<PhotoEdit[]>([]);
  const [title, setTitle] = useState("Better together");
  const [caption, setCaption] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => { if (roomState.completion || roomState.status === "error") camera.stop(); }, [roomState.completion, roomState.status, camera.stop]);
  useEffect(() => () => pairUrls.current.forEach(URL.revokeObjectURL), []);
  useEffect(() => { if (roomState.completion && roomState.room) setResultSettings(roomState.room.settings); }, [roomState.completion]);

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
    pairUrls.current.push(...urls);
    setPairs((current) => {
      const next = [...current];
      next[pair.shotIndex] = urls;
      return next;
    });
  }, [roomState.latestPair]);

  useEffect(() => {
    if (roomState.completion) return;
    setPairs([]);
    setStrip(null);
    setRenderError(null);
    setEdits([]);
    capturedScheduleRef.current = null;
  }, [roomState.completion]);

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
      setCountdown(remaining > 0 ? Math.max(1, Math.ceil(remaining / 1000)) : null);
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
        const image = dataUrlToArrayBuffer(captureFrame(localVideoRef.current!, { mirror: camera.mirrored, quality: 0.78 }));
        roomState.submitCapture({ sessionId: schedule.sessionId, shotIndex: schedule.shotIndex, image });
      } catch (error) {
        setRenderError(error instanceof Error ? error.message : "Your photo could not be captured.");
      }
    }, delay);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [camera.mirrored, camera.status, roomState.schedule, roomState.serverOffset, roomState.submitCapture]);

  const completePairs = useMemo(() => pairs.filter((pair): pair is string[] => Boolean(pair)), [pairs]);
  useEffect(() => {
    if (!roomState.completion || completePairs.length !== 4) return;
    setUpdating(true); setRenderError(null);
    let active = true;
    const renderPairs = edits.length === 8 ? Array.from({ length: 4 }, (_, index) => edits.slice(index * 2, index * 2 + 2)) : completePairs;
    void drawCombinedStrip(renderPairs, theme, resultSettings.layout, { title, caption })
      .then(async (result) => { const image = new Image(); image.src = result; await image.decode(); if (active) { setStrip(result); setUpdating(false); } })
      .catch((error) => { if (active) { setUpdating(false); setRenderError(error instanceof Error ? error.message : "The strip could not be rendered."); } });
    return () => { active = false; };
  }, [caption, completePairs, edits, roomState.completion, resultSettings.layout, theme, title, renderVersion]);

  useEffect(() => {
    if (completePairs.length === 4 && edits.length === 0) setEdits(completePairs.flat().map(createPhotoEdit));
  }, [completePairs, edits.length]);

  useEffect(() => {
    const active = roomState.room?.status === "countdown" || roomState.room?.status === "capturing";
    if (!active || !("wakeLock" in navigator)) return;
    let live = true;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock.request("screen").then((nextLock) => { if (live) lock = nextLock; else void nextLock.release(); }).catch(() => undefined);
    return () => { live = false; void lock?.release(); };
  }, [roomState.room?.status]);

  const copyRoom = useCallback(async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`); }
    catch { setRenderError(`Copy this room code: ${roomCode}`); return; }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

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
    return <ResultExperience photos={completePairs.flat()} edits={edits} strip={strip} updating={updating} theme={theme} onTheme={setTheme} settings={resultSettings} onSettings={setResultSettings} title={title} caption={caption} onTitle={setTitle} onCaption={setCaption} onEdits={setEdits} onAgain={isHost ? () => void roomState.resetSession() : undefined} mode="together" error={renderError} extra={<>{!isHost && <p className={styles.waitingText}>Your host can start another session.</p>}{renderError && <button className="button buttonStrip" type="button" onClick={() => setRenderVersion(value => value + 1)}>Develop again</button>}<button className="button buttonQuiet" type="button" onClick={leave}>Leave room</button></>} />;
  }


  return (
    <section className={styles.room} data-capturing={sessionActive} aria-labelledby="room-title">
      <header className={styles.roomHeader}>
        <div><h1 id="room-title">Room {roomCode}</h1><p className={styles.roomNote}><UsersRound size={16} /> Private two-person booth</p></div>
        <div className={styles.headerActions}><button className="button buttonStamp" type="button" onClick={() => void copyRoom()}><Clipboard size={18} />{copied ? "Link copied" : "Copy invite"}</button><button className="button buttonQuiet" type="button" onClick={leave}><DoorOpen size={18} /> Leave</button></div>
      </header>
      {!partner && <details className={styles.invite}><summary>Invite your person · {roomCode}</summary><InviteCard roomCode={roomCode} /></details>}

      <div className={styles.videoArea}>
        <RoomVideoGrid flash={flash} mirrored={camera.mirrored} localReady={Boolean(self?.ready)} localStream={camera.stream} localVideoRef={localVideoRef}
          partnerConnected={Boolean(partner?.connected)} partnerReady={Boolean(partner?.ready)} remoteStream={peer.remoteStream} />
        {sessionActive && <div className={styles.countdown} aria-live="assertive"><span>Photo {(roomState.room.session?.currentShotIndex ?? 0) + 1} of 4</span><strong>{countdown ?? "Smile!"}</strong><small>{promptForShot(roomState.room.session?.currentShotIndex ?? 0)}</small></div>}
        {roomState.reaction && <ReactionCue key={roomState.reaction.sentAt} reaction={roomState.reaction.reaction} name={partner?.displayName || "Partner"} />}
      </div>
      <aside className={styles.controlBar}>
        <div className={styles.statusGroup}><Status label={self?.displayName || "You"} connected cameraReady={Boolean(self?.cameraReady)} ready={Boolean(self?.ready)} /><Status label={partner?.displayName || "Partner"} connected={Boolean(partner?.connected)} cameraReady={Boolean(partner?.cameraReady)} ready={Boolean(partner?.ready)} /></div>
        <div className={styles.primaryControls}>
          {camera.status === "error" && <button className="button buttonShutter" type="button" onClick={() => void camera.start()}><Camera size={20} /> Try camera again</button>}
          {camera.status === "ready" && (!isHost || !self?.ready) && <button className="button buttonStrip" type="button" onClick={() => roomState.updatePresence({ ready: !self?.ready })} disabled={sessionActive}>{self?.ready ? <><Check size={20} /> Ready</> : "I'm ready"}</button>}
          {isHost && self?.ready ? <button className="button buttonShutter" type="button" onClick={() => void roomState.startSession()} disabled={!canStart || sessionActive}><Camera size={20} /> Start four photos</button> : <span className={styles.waitingText}>{roomState.room.status === "ready" ? "Waiting for host to start" : "Get both cameras ready"}</span>}
        </div>
      </aside>
      <div className={styles.connectionQuality} data-quality={peer.quality} role="status">Partner video: {peer.quality}</div>

      <div className={styles.progressRow} aria-label={`${completePairs.length} of 4 photo pairs received`}>
        {[0, 1, 2, 3].map((index) => <div className={pairs[index] ? styles.pairComplete : ""} key={index}>{pairs[index] ? <Check size={17} /> : index + 1}<span>Pair {index + 1}</span></div>)}
      </div>

      <details className={styles.disclosure}><summary>Camera & timer</summary><div className={styles.boothSettings}>
        <div><strong>Booth setup</strong><span>{isHost ? "Your choices sync to your partner" : "The host controls these options"}</span></div>
        <BoothSettingsPicker disabled={!isHost || sessionActive} settings={roomState.room.settings} onChange={roomState.updateSettings} />
        {camera.status === "ready" && <CameraControls devices={camera.devices} mirrored={camera.mirrored} selectedDeviceId={camera.selectedDeviceId}
          disabled={sessionActive} onFlip={() => void camera.flipCamera()} onMirrorChange={camera.setMirrored} onSelect={(deviceId) => void camera.selectDevice(deviceId)} />}
      </div></details>

      <details className={styles.disclosure}><summary>Names, reactions & room options</summary><div className={styles.socialBar}>
        <label>Display name<input maxLength={24} value={displayName} placeholder={self?.displayName || "Your name"} onChange={(event) => setDisplayName(event.target.value)} onBlur={() => displayName.trim() && roomState.updateProfile(displayName.trim())} /></label>
        <div className={styles.reactions} aria-label="Send a reaction"><button type="button" onClick={() => roomState.sendReaction("heart")} aria-label="Send heart"><Heart size={18} /></button><button type="button" onClick={() => roomState.sendReaction("sparkle")} aria-label="Send sparkle"><Sparkles size={18} /></button><button type="button" onClick={() => roomState.sendReaction("celebrate")} aria-label="Send celebration"><PartyPopper size={18} /></button></div>
        {isHost && <div className={styles.roomPolicy}><button type="button" onClick={() => roomState.updatePolicy(!roomState.room!.locked)}>{roomState.room.locked ? <Lock size={17} /> : <LockOpen size={17} />}{roomState.room.locked ? "Room locked" : "Lock room"}</button>{partner && <button type="button" onClick={() => roomState.kickParticipant(partner.id)}><UserMinus size={17} /> Remove guest</button>}</div>}
      </div></details>


      {(camera.error || roomState.error || renderError) && <p className={styles.error} role="alert">{camera.error ?? roomState.error ?? renderError}</p>}
    </section>
  );
}

function ReactionCue({ reaction, name }: { reaction: "heart" | "sparkle" | "celebrate"; name: string }) {
  const Icon = reaction === "heart" ? Heart : reaction === "sparkle" ? Sparkles : PartyPopper;
  return <div className={styles.reactionCue} role="status"><Icon size={28} /><span>{name} sent a {reaction}</span></div>;
}

function Status({ label, connected, cameraReady, ready }: { label: string; connected: boolean; cameraReady: boolean; ready: boolean }) {
  const text = !connected ? "Offline" : ready ? "Ready" : cameraReady ? "Camera on" : "Camera needed";
  return <div className={ready ? styles.statusReady : ""}><span>{label}</span><strong><i aria-hidden="true" />{text}</strong></div>;
}

function RoomMessage({ title, text, loading, action }: { title: string; text: string; loading?: boolean; action?: () => void }) {
  return <section className={styles.message}>{loading ? <LoaderCircle className={styles.largeSpinner} /> : <UsersRound size={40} />}<h1>{title}</h1><p>{text}</p>{action && <button className="button buttonStrip" onClick={action}>Back to rooms</button>}</section>;
}
