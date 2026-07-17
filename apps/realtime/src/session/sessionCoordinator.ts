import { randomUUID } from "node:crypto";
import { CAPTURE_COUNT, COUNTDOWN_SECONDS, type ClientToServerEvents, type EventResult, type ServerToClientEvents } from "@photobooth/shared";
import type { Server } from "socket.io";
import type { RoomRepository } from "../room/roomRepository.js";
import type { ActiveRoom, RoomParticipant } from "../room/roomTypes.js";

type PhotoboothServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class SessionCoordinator {
  constructor(
    private readonly io: PhotoboothServer,
    private readonly rooms: RoomRepository,
    private readonly maxImageBytes: number,
  ) {}

  start(room: ActiveRoom, participant: RoomParticipant): EventResult<{ sessionId: string }> {
    if (participant.id !== room.hostParticipantId) return failure("HOST_ONLY", "Only the host can start the booth.");
    const participants = [...room.participants.values()];
    if (participants.length !== 2 || participants.some((item) => !item.connected || !item.cameraReady || !item.ready)) {
      return failure("NOT_READY", "Both people need a connected camera and Ready status before starting.");
    }
    if (room.session && room.session.status !== "complete") return failure("SESSION_ACTIVE", "A photo session is already active.");

    room.session = {
      id: randomUUID(),
      status: "countdown",
      currentShotIndex: 0,
      shotCount: CAPTURE_COUNT,
      captures: new Map(),
    };
    room.status = "countdown";
    this.broadcastState(room);
    this.schedule(room);
    return { ok: true, data: { sessionId: room.session.id } };
  }

  submit(
    room: ActiveRoom,
    participant: RoomParticipant,
    payload: { sessionId: string; shotIndex: number; image: ArrayBuffer | Uint8Array },
  ): EventResult<{ accepted: true }> {
    const session = room.session;
    if (!session || session.id !== payload.sessionId) return failure("STALE_SESSION", "That photo belongs to an old session.");
    if (session.status !== "capturing" || payload.shotIndex !== session.currentShotIndex) {
      return failure("WRONG_SHOT", "That capture does not match the active photo round.");
    }

    const image = normalizeImage(payload.image);
    if (!image) return failure("INVALID_IMAGE", "The submitted photo could not be read.");
    if (image.byteLength > this.maxImageBytes) return failure("IMAGE_TOO_LARGE", "The photo is larger than the room limit.");

    const round = session.captures.get(payload.shotIndex) ?? new Map();
    if (round.has(participant.id)) return failure("DUPLICATE_CAPTURE", "Your photo for this round was already received.");
    round.set(participant.id, { participantId: participant.id, image });
    session.captures.set(payload.shotIndex, round);

    if (round.size === 2) this.completeRound(room);
    return { ok: true, data: { accepted: true } };
  }

  cancel(room: ActiveRoom, message: string) {
    room.session = undefined;
    this.rooms.refreshStatus(room);
    this.io.to(room.code).emit("session:cancelled", { message });
    this.broadcastState(room);
  }

  private schedule(room: ActiveRoom) {
    const session = room.session;
    if (!session) return;
    session.status = "countdown";
    room.status = "countdown";
    const countdownStartsAt = Date.now() + 700;
    const captureAt = countdownStartsAt + COUNTDOWN_SECONDS * 1000;
    this.broadcastState(room);
    this.io.to(room.code).emit("capture:scheduled", {
      roomCode: room.code,
      sessionId: session.id,
      shotIndex: session.currentShotIndex,
      countdownStartsAt,
      captureAt,
    });

    const timer = setTimeout(() => {
      if (!room.session || room.session.id !== session.id) return;
      session.status = "capturing";
      room.status = "capturing";
      this.broadcastState(room);
      const timeout = setTimeout(() => {
        const current = room.session;
        const received = current?.captures.get(current.currentShotIndex)?.size ?? 0;
        if (current?.id === session.id && received < 2) this.cancel(room, "A photo did not arrive in time. Check both connections and try again.");
      }, 12_000);
      timeout.unref();
    }, captureAt - Date.now());
    timer.unref();
  }

  private completeRound(room: ActiveRoom) {
    const session = room.session;
    if (!session) return;
    const round = session.captures.get(session.currentShotIndex);
    if (!round) return;
    const participantOrder = [...room.participants.values()]
      .sort((a, b) => (a.role === "host" ? -1 : b.role === "host" ? 1 : 0))
      .map((participant) => participant.id);
    this.io.to(room.code).emit("capture:pair-ready", {
      sessionId: session.id,
      shotIndex: session.currentShotIndex,
      images: participantOrder.map((id) => round.get(id)!).filter(Boolean),
    });

    if (session.currentShotIndex === session.shotCount - 1) {
      session.status = "complete";
      room.status = "complete";
      this.broadcastState(room);
      this.io.to(room.code).emit("session:complete", { sessionId: session.id, participantOrder });
      return;
    }

    session.currentShotIndex += 1;
    const timer = setTimeout(() => this.schedule(room), 1_200);
    timer.unref();
  }

  private broadcastState(room: ActiveRoom) {
    this.io.to(room.code).emit("room:state", this.rooms.publicState(room));
  }
}

function normalizeImage(image: ArrayBuffer | Uint8Array) {
  if (image instanceof ArrayBuffer) return image;
  if (ArrayBuffer.isView(image)) return image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) as ArrayBuffer;
  return undefined;
}

function failure<T>(code: string, message: string): EventResult<T> {
  return { ok: false, error: { code, message } };
}
