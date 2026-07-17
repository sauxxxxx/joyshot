import { randomUUID } from "node:crypto";
import type { Membership, ParticipantState, RoomState } from "@photobooth/shared";
import { generateRoomCode } from "./generateRoomCode.js";
import type { ActiveRoom, RoomParticipant } from "./roomTypes.js";

export class RoomRepository {
  private readonly rooms = new Map<string, ActiveRoom>();
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomTtlMs: number,
    private readonly reconnectGraceMs: number,
  ) {}

  create(socketId: string): Membership {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const participant = this.createParticipant(socketId, "host");
    const room: ActiveRoom = {
      code,
      status: "waiting",
      hostParticipantId: participant.id,
      participants: new Map([[participant.id, participant]]),
      createdAt: Date.now(),
      expiresAt: Date.now() + this.roomTtlMs,
    };
    this.rooms.set(code, room);
    return this.membership(room, participant);
  }

  join(code: string, socketId: string, resumeToken?: string): Membership {
    const room = this.rooms.get(code);
    if (!room) throw new RoomError("ROOM_NOT_FOUND", "That room does not exist or has expired.");

    if (resumeToken) {
      const returning = [...room.participants.values()].find((participant) => participant.resumeToken === resumeToken);
      if (returning) {
        this.clearDisconnectTimer(returning.id);
        returning.socketId = socketId;
        returning.connected = true;
        returning.disconnectedAt = undefined;
        this.refreshStatus(room);
        return this.membership(room, returning);
      }
    }

    if (room.participants.size >= 2) throw new RoomError("ROOM_FULL", "That booth already has two people.");
    if (room.session && room.session.status !== "complete") {
      throw new RoomError("SESSION_ACTIVE", "That booth is already taking photos.");
    }

    const participant = this.createParticipant(socketId, "guest");
    room.participants.set(participant.id, participant);
    room.expiresAt = Date.now() + this.roomTtlMs;
    this.refreshStatus(room);
    return this.membership(room, participant);
  }

  get(code: string) {
    return this.rooms.get(code);
  }

  getBySocket(socketId: string) {
    for (const room of this.rooms.values()) {
      const participant = [...room.participants.values()].find((item) => item.socketId === socketId);
      if (participant) return { room, participant };
    }
    return undefined;
  }

  markDisconnected(socketId: string, onExpired: (room: ActiveRoom) => void) {
    const membership = this.getBySocket(socketId);
    if (!membership) return undefined;
    const { room, participant } = membership;
    participant.connected = false;
    participant.ready = false;
    participant.cameraReady = false;
    participant.disconnectedAt = Date.now();
    if (room.session?.status !== "complete") room.status = "participant-disconnected";

    const timer = setTimeout(() => {
      room.participants.delete(participant.id);
      this.disconnectTimers.delete(participant.id);
      if (participant.role === "host" || room.participants.size === 0) {
        this.rooms.delete(room.code);
        onExpired(room);
      } else {
        this.refreshStatus(room);
        onExpired(room);
      }
    }, this.reconnectGraceMs);
    timer.unref();
    this.disconnectTimers.set(participant.id, timer);
    return room;
  }

  removeParticipant(room: ActiveRoom, participant: RoomParticipant) {
    this.clearDisconnectTimer(participant.id);
    room.participants.delete(participant.id);
    if (participant.role === "host" || room.participants.size === 0) this.rooms.delete(room.code);
    else this.refreshStatus(room);
  }

  refreshStatus(room: ActiveRoom) {
    if (room.session && room.session.status !== "complete") return;
    const participants = [...room.participants.values()];
    if (participants.some((participant) => !participant.connected)) room.status = "participant-disconnected";
    else if (participants.length === 2 && participants.every((participant) => participant.cameraReady && participant.ready)) room.status = "ready";
    else room.status = "waiting";
  }

  publicState(room: ActiveRoom): RoomState {
    return {
      code: room.code,
      status: room.status,
      hostParticipantId: room.hostParticipantId,
      participants: [...room.participants.values()]
        .sort((a, b) => (a.role === "host" ? -1 : b.role === "host" ? 1 : a.joinedAt - b.joinedAt))
        .map<ParticipantState>(({ id, role, connected, cameraReady, ready }) => ({ id, role, connected, cameraReady, ready })),
      session: room.session
        ? { id: room.session.id, status: room.session.status, currentShotIndex: room.session.currentShotIndex, shotCount: room.session.shotCount }
        : undefined,
    };
  }

  cleanupExpired(onExpired: (room: ActiveRoom) => void) {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.expiresAt <= now) {
        this.rooms.delete(room.code);
        onExpired(room);
      }
    }
  }

  private createParticipant(socketId: string, role: "host" | "guest"): RoomParticipant {
    return {
      id: randomUUID(),
      resumeToken: `${randomUUID()}${randomUUID()}`,
      socketId,
      role,
      connected: true,
      cameraReady: false,
      ready: false,
      joinedAt: Date.now(),
    };
  }

  private membership(room: ActiveRoom, participant: RoomParticipant): Membership {
    return { participantId: participant.id, resumeToken: participant.resumeToken, role: participant.role, room: this.publicState(room) };
  }

  private clearDisconnectTimer(participantId: string) {
    const timer = this.disconnectTimers.get(participantId);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(participantId);
  }
}

export class RoomError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}
