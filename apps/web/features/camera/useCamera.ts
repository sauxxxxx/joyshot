"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

function getCameraErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "We could not start your camera. Check your browser settings and try again.";
  }

  switch (error.name) {
    case "NotAllowedError":
      return "Camera access is blocked. Allow it in your browser settings, then try again.";
    case "NotFoundError":
      return "No camera was found. Connect a camera and try again.";
    case "NotReadableError":
      return "Your camera is being used by another app. Close it there, then try again.";
    default:
      return "We could not start your camera. Check your browser settings and try again.";
  }
}

export function useCamera({ autoStart = false }: { autoStart?: boolean } = {}) {
  const autoStartAttemptedRef = useRef(false);
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
    setDevices(cameras);
    setSelectedDeviceId((current) => current || cameras[0]?.deviceId || "");
  }, []);

  const stop = useCallback(() => {
    setStream((activeStream) => {
      activeStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setStatus("idle");
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    if (!window.isSecureContext) {
      setError("Camera access requires HTTPS on another device. Open the secure LAN URL provided by npm run dev:https.");
      setStatus("error");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access. Try a current version of Chrome, Edge, or Safari.");
      setStatus("error");
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId || selectedDeviceId
            ? { deviceId: { exact: deviceId || selectedDeviceId } }
            : { facingMode: "user" }),
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      setStream((activeStream) => {
        activeStream?.getTracks().forEach((track) => track.stop());
        return nextStream;
      });
      const activeDeviceId = nextStream.getVideoTracks()[0]?.getSettings().deviceId;
      if (activeDeviceId) setSelectedDeviceId(activeDeviceId);
      setStatus("ready");
      await refreshDevices();
    } catch (cameraError) {
      setError(getCameraErrorMessage(cameraError));
      setStatus("error");
    }
  }, [refreshDevices, selectedDeviceId]);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await start(deviceId);
  }, [start]);

  const flipCamera = useCallback(async () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(({ deviceId }) => deviceId === selectedDeviceId);
    const next = devices[(currentIndex + 1) % devices.length];
    if (next) await selectDevice(next.deviceId);
  }, [devices, selectDevice, selectedDeviceId]);

  useEffect(() => {
    if (!autoStart || autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    void start();
  }, [autoStart, start]);

  useEffect(() => () => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  return {
    devices,
    error,
    flipCamera,
    mirrored,
    refreshDevices,
    selectDevice,
    selectedDeviceId,
    setMirrored,
    start,
    status,
    stop,
    stream,
  };
}
