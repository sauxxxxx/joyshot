"use client";

import { Camera, FlipHorizontal2, RefreshCw } from "lucide-react";
import type { CameraDevice } from "./useCamera";
import styles from "./CameraControls.module.css";

interface CameraControlsProps {
  devices: CameraDevice[];
  mirrored: boolean;
  selectedDeviceId: string;
  disabled?: boolean;
  onFlip: () => void;
  onMirrorChange: (mirrored: boolean) => void;
  onSelect: (deviceId: string) => void;
}

export function CameraControls(props: CameraControlsProps) {
  return (
    <div className={styles.controls} aria-label="Camera options">
      <label>
        <span><Camera size={16} /> Camera</span>
        <select value={props.selectedDeviceId} disabled={props.disabled || props.devices.length < 2}
          onChange={(event) => props.onSelect(event.target.value)}>
          {props.devices.length === 0 && <option value="">Default camera</option>}
          {props.devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
        </select>
      </label>
      <button type="button" onClick={props.onFlip} disabled={props.disabled || props.devices.length < 2}>
        <RefreshCw size={17} /> Switch camera
      </button>
      <button type="button" aria-pressed={props.mirrored} disabled={props.disabled}
        onClick={() => props.onMirrorChange(!props.mirrored)}>
        <FlipHorizontal2 size={17} /> {props.mirrored ? "Mirrored" : "Not mirrored"}
      </button>
    </div>
  );
}
