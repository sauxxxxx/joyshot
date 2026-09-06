"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./CurtainEntry.module.css";

const timers = [3, 5, 10] as const;

export function CurtainEntry() {
  const [timer, setTimer] = useState<(typeof timers)[number]>(5);
  return <section className={styles.entry} aria-labelledby="curtain-title">
    <div className={styles.hardware}>
      <span className={styles.serial}>JOYSHOT · READY LAMP 04</span>
      <h2 id="curtain-title">Come as you are.</h2>
      <p>Choose how long you need. The curtain is ready when you are.</p>
      <fieldset><legend>Timer</legend><div>{timers.map((value) => <button key={value} type="button" aria-pressed={timer === value} onClick={() => setTimer(value)}><b>{value}</b><small>SEC</small></button>)}</div></fieldset>
      <Link className={styles.shutter} href={`/solo?timer=${timer}`} aria-label={`Start the booth with a ${timer} second timer`}><i aria-hidden="true" /><span>PRESS TO START</span></Link>
    </div>
  </section>;
}
