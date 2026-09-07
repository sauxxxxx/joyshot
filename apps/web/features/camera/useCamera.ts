"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";
export interface CameraDevice { deviceId: string; label: string; }

function getCameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "Camera access wasn't allowed. Open the site controls beside your browser's address, allow Camera, then try again.";
  if (name === "NotFoundError") return "No camera was found. Connect a camera, then try again.";
  if (name === "NotReadableError") return "Your camera is busy. Close other apps using it, then try again.";
  return "Your camera could not start. Check the connection and try again.";
}

export function useCamera({ autoStart = false }: { autoStart?: boolean } = {}) {
  const activeStream = useRef<MediaStream | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(false);
  const selected = useRef("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [mirrored, setMirrored] = useState(true);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const cameras = (await navigator.mediaDevices.enumerateDevices())
      .filter(({ kind }) => kind === "videoinput")
      .map(({ deviceId, label }, index) => ({ deviceId, label: label || `Camera ${index + 1}` }));
    if (mounted.current) setDevices(cameras);
  }, []);

  const stop = useCallback(() => {
    requestId.current += 1;
    activeStream.current?.getTracks().forEach(track => track.stop());
    activeStream.current = null;
    if (mounted.current) { setStream(null); setStatus("idle"); }
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    const id = ++requestId.current;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(!window.isSecureContext ? "Open JoyShot using HTTPS to use your camera." : "This browser cannot access a camera. Try Chrome, Edge, or Safari.");
      setStatus("error"); return;
    }
    setStatus("requesting"); setError(null);
    try {
      const chosen = deviceId || selected.current;
      const next = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        ...(chosen ? { deviceId: { exact: chosen } } : { facingMode: "user" }),
        width: { ideal: 1280 }, height: { ideal: 960 },
      } });
      if (!mounted.current || id !== requestId.current) { next.getTracks().forEach(track => track.stop()); return; }
      activeStream.current?.getTracks().forEach(track => track.stop());
      activeStream.current = next; setStream(next);
      selected.current = next.getVideoTracks()[0]?.getSettings().deviceId || "";
      setSelectedDeviceId(selected.current); setStatus("ready");
      next.getVideoTracks()[0]?.addEventListener?.("ended", () => {
        if (activeStream.current !== next || !mounted.current) return;
        stop(); setError("The camera disconnected. Reconnect it and try again."); setStatus("error");
      });
      await refreshDevices().catch(() => undefined);
    } catch (failure) {
      if (mounted.current && id === requestId.current) { setError(getCameraErrorMessage(failure)); setStatus("error"); }
    }
  }, [refreshDevices, stop]);

  const selectDevice = useCallback(async (deviceId: string) => { await start(deviceId); }, [start]);
  const flipCamera = useCallback(async () => {
    if (devices.length < 2) return;
    const index = devices.findIndex(device => device.deviceId === selected.current);
    await start(devices[(index + 1) % devices.length].deviceId);
  }, [devices, start]);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, [stop]);
  useEffect(() => {
    if (!autoStart) return;
    // Defer one task so React's development effect replay cannot request twice.
    const timer = window.setTimeout(() => { void start(); }, 0);
    return () => window.clearTimeout(timer);
  }, [autoStart, start]);

  return { devices, error, flipCamera, mirrored, refreshDevices, selectDevice, selectedDeviceId, setMirrored, start, status, stop, stream };
}
