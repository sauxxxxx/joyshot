"use client";

import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { roomCodeSchema } from "@photobooth/shared";
import { getSocket } from "@/lib/socket";
import { storeMembership } from "./membershipStorage";
import styles from "./RoomEntry.module.css";

export function RoomEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [action, setAction] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createRoom = () => {
    setAction("create");
    setError(null);
    const socket = getSocket();
    const timeout = window.setTimeout(() => {
      setError("The realtime server did not respond. Check that port 3001 is running and reachable.");
      setAction(null);
    }, 8_000);
    const handleConnectionError = () => {
      window.clearTimeout(timeout);
      socket.disconnect();
      setError("The realtime server could not be reached from this device.");
      setAction(null);
    };
    socket.once("connect_error", handleConnectionError);
    if (!socket.connected) socket.connect();
    socket.emit("room:create", (result) => {
      window.clearTimeout(timeout);
      socket.off("connect_error", handleConnectionError);
      if (!result.ok) {
        setError(result.error.message);
        setAction(null);
        return;
      }
      storeMembership(result.data);
      router.push(`/room/${result.data.room.code}`);
    });
  };

  const joinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = roomCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid room code.");
      return;
    }
    setAction("join");
    setError(null);
    router.push(`/room/${parsed.data}`);
  };

  return (
    <section className={styles.entry} aria-labelledby="room-entry-title">
      <div className={styles.intro}>
        <span className="eyebrow"><UsersRound size={17} /> Two-person booth</span>
        <h1 id="room-entry-title">Close the distance for four little moments.</h1>
        <p>Create a private room, share the six-character code, and take the same photos together.</p>
        <div className={styles.privacy}><LockKeyhole size={19} /><span>Rooms hold only two people and expire automatically.</span></div>
      </div>

      <div className={styles.actions}>
        <article className={styles.createCard}>
          <span className={styles.cardIcon}><UsersRound size={28} /></span>
          <h2>Start a new room</h2>
          <p>You will be the host and control when the shared countdown begins.</p>
          <button className="button buttonPrimary" type="button" onClick={createRoom} disabled={action !== null}>
            {action === "create" ? <LoaderCircle className={styles.spinner} size={20} /> : <UsersRound size={20} />}
            {action === "create" ? "Creating room..." : "Create private room"}
          </button>
        </article>

        <form className={styles.joinCard} onSubmit={joinRoom} noValidate>
          <span className={styles.cardIcon}><KeyRound size={28} /></span>
          <h2>Join your person</h2>
          <p>Enter the room code they sent you.</p>
          <label htmlFor="room-code">Six-character room code</label>
          <input id="room-code" value={code} maxLength={6} autoComplete="off" spellCheck={false}
            inputMode="text" placeholder="K7P4QX" onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/gu, ""))}
            aria-describedby={error ? "room-error" : "room-helper"} />
          <span className={styles.helper} id="room-helper">Codes do not use 0, O, 1, or I.</span>
          <button className="button buttonSecondary" type="submit" disabled={action !== null}>
            {action === "join" ? <LoaderCircle className={styles.spinner} size={20} /> : <ArrowRight size={20} />}
            {action === "join" ? "Opening room..." : "Join room"}
          </button>
        </form>
        {error && <p className={styles.error} id="room-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
