"use client";

import { useCallback, useEffect, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";

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

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    setStream((activeStream) => {
      activeStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
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
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      setStream((activeStream) => {
        activeStream?.getTracks().forEach((track) => track.stop());
        return nextStream;
      });
      setStatus("ready");
    } catch (cameraError) {
      setError(getCameraErrorMessage(cameraError));
      setStatus("error");
    }
  }, []);

  useEffect(() => () => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  return { error, start, status, stop, stream };
}
