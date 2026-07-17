"use client";

import type { ClientToServerEvents, ServerToClientEvents } from "@photobooth/shared";
import { io, type Socket } from "socket.io-client";

export type PhotoboothSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: PhotoboothSocket | undefined;

function getRealtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_REALTIME_URL;
  const pageHost = window.location.hostname;
  const isRemotePage = pageHost !== "localhost" && pageHost !== "127.0.0.1";
  const configuredUsesLocalhost = configured?.includes("localhost") || configured?.includes("127.0.0.1");

  if (!configured || (isRemotePage && configuredUsesLocalhost)) {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${pageHost}:3001`;
  }
  return configured;
}

export function getSocket() {
  if (!socket) {
    socket = io(getRealtimeUrl(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
