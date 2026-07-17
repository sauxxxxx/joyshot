import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import type { ClientToServerEvents, ServerToClientEvents } from "@photobooth/shared";
import cors, { type CorsOptions } from "cors";
import express from "express";
import { Server } from "socket.io";
import { RoomRepository } from "./room/roomRepository.js";
import { SessionCoordinator } from "./session/captureSessionCoordinator.js";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";

export interface RealtimeServerOptions {
  webOrigin: string;
  allowLanOrigins?: boolean;
  roomTtlMs: number;
  reconnectGraceMs: number;
  maxImageBytes: number;
  tls?: {
    cert: string | Buffer;
    key: string | Buffer;
  };
}

export function createRealtimeServer(options: RealtimeServerOptions) {
  const origin: CorsOptions["origin"] = (requestOrigin, callback) => {
    const allowed = !requestOrigin
      || requestOrigin === options.webOrigin
      || (options.allowLanOrigins === true && isPrivateDevelopmentOrigin(requestOrigin));
    callback(allowed ? null : new Error("Origin is not allowed."), allowed);
  };
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok", service: "photobooth-realtime" }));

  const httpServer = options.tls
    ? createHttpsServer(options.tls, app)
    : createHttpServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin, methods: ["GET", "POST"] },
    maxHttpBufferSize: options.maxImageBytes + 64_000,
  });
  const rooms = new RoomRepository(options.roomTtlMs, options.reconnectGraceMs);
  const sessions = new SessionCoordinator(io, rooms, options.maxImageBytes);
  io.on("connection", (socket) => registerSocketHandlers(io, socket, rooms, sessions));

  const cleanupTimer = setInterval(() => {
    rooms.cleanupExpired((room) => io.to(room.code).emit("room:closed", { message: "This booth expired after being inactive." }));
  }, 60_000);
  cleanupTimer.unref();
  httpServer.on("close", () => clearInterval(cleanupTimer));

  return { app, httpServer, io, rooms };
}

function isPrivateDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol) || url.port !== "3000") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    if (/^10\.(?:\d{1,3}\.){2}\d{1,3}$/u.test(url.hostname)) return true;
    if (/^192\.168\.(?:\d{1,3})\.(?:\d{1,3})$/u.test(url.hostname)) return true;
    const match = /^172\.(\d{1,3})\.(?:\d{1,3})\.(?:\d{1,3})$/u.exec(url.hostname);
    return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
  } catch {
    return false;
  }
}
