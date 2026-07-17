"use client";

import type { CapturePair, CaptureSchedule, Membership, RoomState, SessionComplete } from "@photobooth/shared";
import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { clearMembership, readMembership, storeMembership } from "./membershipStorage";

export function useRoom(roomCode: string) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [schedule, setSchedule] = useState<CaptureSchedule | null>(null);
  const [latestPair, setLatestPair] = useState<CapturePair | null>(null);
  const [completion, setCompletion] = useState<SessionComplete | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [status, setStatus] = useState<"connecting" | "joined" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const socket = getSocket();

  useEffect(() => {
    const normalizedCode = roomCode.toUpperCase();
    const handleState = (state: RoomState) => {
      setRoom(state);
      if (!state.session) {
        setSchedule(null);
        setLatestPair(null);
        setCompletion(null);
      }
    };
    const handleClosed = ({ message }: { message: string }) => {
      clearMembership(normalizedCode);
      setError(message);
      setStatus("error");
    };
    const handleCancelled = ({ message }: { message: string }) => {
      setSchedule(null);
      setCompletion(null);
      setError(message);
    };
    const handleConnectionError = () => {
      setError("The realtime server could not be reached from this device.");
      setStatus("error");
    };
    const handleSchedule = (nextSchedule: CaptureSchedule) => {
      if (nextSchedule.shotIndex === 0) setCompletion(null);
      setSchedule(nextSchedule);
    };

    socket.on("room:state", handleState);
    socket.on("room:closed", handleClosed);
    socket.on("capture:scheduled", handleSchedule);
    socket.on("capture:pair-ready", setLatestPair);
    socket.on("session:complete", setCompletion);
    socket.on("session:cancelled", handleCancelled);
    socket.on("connect_error", handleConnectionError);

    const join = () => {
      const stored = readMembership(normalizedCode);
      socket.emit("room:join", { roomCode: normalizedCode, resumeToken: stored?.resumeToken }, (result) => {
        if (!result.ok) {
          setError(result.error.message);
          setStatus("error");
          return;
        }
        storeMembership(result.data);
        setMembership(result.data);
        setRoom(result.data.room);
        setStatus("joined");

        const samples: number[] = [];
        for (let index = 0; index < 4; index += 1) {
          const sentAt = Date.now();
          socket.emit("time:ping", sentAt, (serverTime) => {
            samples.push(serverTime - (sentAt + (Date.now() - sentAt) / 2));
            if (samples.length === 4) setServerOffset(samples.sort((a, b) => Math.abs(a) - Math.abs(b))[0] ?? 0);
          });
        }
      });
    };

    if (!socket.connected) socket.connect();
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      socket.off("room:state", handleState);
      socket.off("room:closed", handleClosed);
      socket.off("capture:scheduled", handleSchedule);
      socket.off("capture:pair-ready", setLatestPair);
      socket.off("session:complete", setCompletion);
      socket.off("session:cancelled", handleCancelled);
      socket.off("connect_error", handleConnectionError);
    };
  }, [roomCode, socket]);

  const updatePresence = useCallback((presence: { cameraReady?: boolean; ready?: boolean }) => {
    socket.emit("participant:presence", { roomCode: roomCode.toUpperCase(), ...presence }, (result) => {
      if (!result.ok) setError(result.error.message);
    });
  }, [roomCode, socket]);

  const startSession = useCallback(() => new Promise<boolean>((resolve) => {
    setError(null);
    setCompletion(null);
    socket.emit("session:start", { roomCode: roomCode.toUpperCase() }, (result) => {
      if (!result.ok) setError(result.error.message);
      resolve(result.ok);
    });
  }), [roomCode, socket]);

  const resetSession = useCallback(() => new Promise<boolean>((resolve) => {
    setError(null);
    socket.emit("session:reset", { roomCode: roomCode.toUpperCase() }, (result) => {
      if (!result.ok) setError(result.error.message);
      resolve(result.ok);
    });
  }), [roomCode, socket]);

  const submitCapture = useCallback((payload: { sessionId: string; shotIndex: number; image: ArrayBuffer }) => {
    socket.emit("capture:submit", { roomCode: roomCode.toUpperCase(), ...payload }, (result) => {
      if (!result.ok) setError(result.error.message);
    });
  }, [roomCode, socket]);

  const leave = useCallback(() => {
    socket.emit("room:leave", { roomCode: roomCode.toUpperCase() });
    clearMembership(roomCode.toUpperCase());
  }, [roomCode, socket]);

  return { completion, error, latestPair, leave, membership, resetSession, room, schedule, serverOffset, socket, startSession, status, submitCapture, updatePresence };
}
