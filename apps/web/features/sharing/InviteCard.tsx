"use client";

import { Copy, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { shareLink } from "./shareMedia";
import styles from "./InviteCard.module.css";

export function InviteCard({ roomCode }: { roomCode: string }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    setUrl(inviteUrl);
    void QRCode.toDataURL(inviteUrl, { width: 280, margin: 1, color: { dark: "#182033", light: "#ffffff" } }).then(setQr);
  }, [roomCode]);
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value); setMessage(`${label} copied`);
  };
  return (
    <details className={styles.invite}>
      <summary><QrCode size={18} /> Invite options</summary>
      <div className={styles.body}>
        {qr && <img src={qr} alt={`QR code to join room ${roomCode}`} />}
        <div><span>Room code</span><strong>{roomCode}</strong><p>Scan the QR code or share the private link.</p>
          <div className={styles.actions}>
            <button type="button" onClick={() => void copy(roomCode, "Room code")}><Copy size={17} /> Code</button>
            <button type="button" onClick={() => void copy(url, "Invite link")}><Copy size={17} /> Link</button>
            <button type="button" onClick={() => void shareLink(url, `Join room ${roomCode}`).then((result) => setMessage(result === "shared" ? "Invite shared" : "Invite link copied"))}><Share2 size={17} /> Share</button>
          </div>
          {message && <small role="status">{message}</small>}
        </div>
      </div>
    </details>
  );
}
