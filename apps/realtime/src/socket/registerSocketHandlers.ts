import {
  candidateMessageSchema,
  descriptionMessageSchema,
  peerReadyMessageSchema,
  roomCodeSchema,
  roomJoinSchema,
  roomPresenceSchema,
  sessionStartSchema,
  type ClientToServerEvents,
  type EventResult,
  type IceCandidateData,
  type ServerToClientEvents,
  type SessionDescriptionData,
} from "@photobooth/shared";
import type { Server, Socket } from "socket.io";
import { RoomError, RoomRepository } from "../room/roomRepository.js";
import { SessionCoordinator } from "../session/captureSessionCoordinator.js";

type PhotoboothServer = Server<ClientToServerEvents, ServerToClientEvents>;
type PhotoboothSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(
  io: PhotoboothServer,
  socket: PhotoboothSocket,
  rooms: RoomRepository,
  sessions: SessionCoordinator,
) {
  socket.emit("server:ready", { connectedAt: Date.now() });

  socket.on("room:create", (callback) => {
    try {
      const membership = rooms.create(socket.id);
      void socket.join(membership.room.code);
      callback({ ok: true, data: membership });
      io.to(membership.room.code).emit("room:state", membership.room);
    } catch (error) {
      callback(asFailure(error));
    }
  });

  socket.on("room:join", (payload, callback) => {
    const parsed = roomJoinSchema.safeParse(payload);
    if (!parsed.success) return callback(failure("INVALID_ROOM_CODE", parsed.error.issues[0]?.message ?? "Invalid room code."));
    try {
      const membership = rooms.join(parsed.data.roomCode, socket.id, parsed.data.resumeToken);
      void socket.join(membership.room.code);
      callback({ ok: true, data: membership });
      io.to(membership.room.code).emit("room:state", membership.room);
    } catch (error) {
      callback(asFailure(error));
    }
  });

  socket.on("participant:presence", (payload, callback) => {
    const parsed = roomPresenceSchema.safeParse(payload);
    if (!parsed.success) return callback(failure("INVALID_PRESENCE", "That participant update was invalid."));
    const found = rooms.getBySocket(socket.id);
    if (!found || found.room.code !== parsed.data.roomCode) return callback(failure("NOT_IN_ROOM", "Join the room before changing your status."));
    if (found.room.session && found.room.session.status !== "complete") return callback(failure("SESSION_ACTIVE", "Status cannot change during a photo session."));
    if (parsed.data.cameraReady !== undefined) found.participant.cameraReady = parsed.data.cameraReady;
    if (parsed.data.ready !== undefined) found.participant.ready = parsed.data.ready;
    if (!found.participant.cameraReady) found.participant.ready = false;
    rooms.refreshStatus(found.room);
    const state = rooms.publicState(found.room);
    io.to(found.room.code).emit("room:state", state);
    callback({ ok: true, data: state });
  });

  socket.on("session:start", (payload, callback) => {
    const parsed = sessionStartSchema.safeParse(payload);
    const found = rooms.getBySocket(socket.id);
    if (!parsed.success || !found || found.room.code !== parsed.data.roomCode) return callback(failure("NOT_IN_ROOM", "Join the room before starting."));
    callback(sessions.start(found.room, found.participant));
  });

  socket.on("session:reset", (payload, callback) => {
    const parsed = sessionStartSchema.safeParse(payload);
    const found = rooms.getBySocket(socket.id);
    if (!parsed.success || !found || found.room.code !== parsed.data.roomCode) {
      return callback(failure("NOT_IN_ROOM", "Join the room before resetting."));
    }
    callback(sessions.reset(found.room, found.participant));
  });

  socket.on("capture:submit", (payload, callback) => {
    const code = roomCodeSchema.safeParse(payload.roomCode);
    const found = rooms.getBySocket(socket.id);
    if (!code.success || !found || found.room.code !== code.data) return callback(failure("NOT_IN_ROOM", "Join the room before submitting a photo."));
    callback(sessions.submit(found.room, found.participant, payload));
  });

  socket.on("webrtc:offer", (payload) => forwardSignal(io, socket, rooms, "webrtc:offer", payload));
  socket.on("webrtc:answer", (payload) => forwardSignal(io, socket, rooms, "webrtc:answer", payload));
  socket.on("webrtc:ice-candidate", (payload) => forwardSignal(io, socket, rooms, "webrtc:ice-candidate", payload));
  socket.on("webrtc:ready", (payload) => {
    const parsed = peerReadyMessageSchema.safeParse(payload);
    const found = rooms.getBySocket(socket.id);
    if (!parsed.success || !found || found.room.code !== parsed.data.roomCode) return;
    const target = found.room.participants.get(parsed.data.targetParticipantId);
    if (target?.connected) io.to(target.socketId).emit("webrtc:ready", { fromParticipantId: found.participant.id });
  });
  socket.on("time:ping", (_clientSentAt, callback) => callback(Date.now()));

  socket.on("room:leave", ({ roomCode }) => {
    const found = rooms.getBySocket(socket.id);
    if (!found || found.room.code !== roomCode) return;
    rooms.removeParticipant(found.room, found.participant);
    void socket.leave(roomCode);
    if (found.participant.role === "host") io.to(roomCode).emit("room:closed", { message: "The host closed this booth." });
    else io.to(roomCode).emit("room:state", rooms.publicState(found.room));
  });

  socket.on("disconnect", () => {
    const room = rooms.markDisconnected(socket.id, (changedRoom) => {
      if (changedRoom.participants.size === 0 || !rooms.get(changedRoom.code)) io.to(changedRoom.code).emit("room:closed", { message: "This booth has closed." });
      else io.to(changedRoom.code).emit("room:state", rooms.publicState(changedRoom));
    });
    if (room) {
      if (room.session && room.session.status !== "complete") sessions.cancel(room, "A participant disconnected. Reconnect, then start a new session.");
      io.to(room.code).emit("room:state", rooms.publicState(room));
    }
  });
}

function forwardSignal(
  io: PhotoboothServer,
  socket: PhotoboothSocket,
  rooms: RoomRepository,
  event: "webrtc:offer" | "webrtc:answer" | "webrtc:ice-candidate",
  payload: unknown,
) {
  const parsed = event === "webrtc:ice-candidate"
    ? candidateMessageSchema.safeParse(payload)
    : descriptionMessageSchema.safeParse(payload);
  const found = rooms.getBySocket(socket.id);
  if (!parsed.success || !found || found.room.code !== parsed.data.roomCode) return;
  const target = found.room.participants.get(parsed.data.targetParticipantId);
  if (!target?.connected) return;
  const fromParticipantId = found.participant.id;
  if (event === "webrtc:offer") {
    io.to(target.socketId).emit("webrtc:offer", { fromParticipantId, data: parsed.data.data as SessionDescriptionData });
  } else if (event === "webrtc:answer") {
    io.to(target.socketId).emit("webrtc:answer", { fromParticipantId, data: parsed.data.data as SessionDescriptionData });
  } else {
    io.to(target.socketId).emit("webrtc:ice-candidate", { fromParticipantId, data: parsed.data.data as IceCandidateData });
  }
}

function failure<T>(code: string, message: string): EventResult<T> {
  return { ok: false, error: { code, message } };
}

function asFailure<T>(error: unknown): EventResult<T> {
  if (error instanceof RoomError) return failure(error.code, error.message);
  return failure("SERVER_ERROR", "The booth could not complete that request.");
}
