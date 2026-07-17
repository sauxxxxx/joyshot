import { z } from "zod";

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/u, "Enter a valid six-character room code.");

export const roomJoinSchema = z.object({
  roomCode: roomCodeSchema,
  resumeToken: z.string().min(32).optional(),
});

export const roomPresenceSchema = z.object({
  roomCode: roomCodeSchema,
  cameraReady: z.boolean().optional(),
  ready: z.boolean().optional(),
});

export type ParticipantRole = "host" | "guest";
export type RoomStatus =
  | "waiting"
  | "ready"
  | "countdown"
  | "capturing"
  | "complete"
  | "participant-disconnected";

export interface ParticipantState {
  id: string;
  role: ParticipantRole;
  connected: boolean;
  cameraReady: boolean;
  ready: boolean;
}

export interface PublicSessionState {
  id: string;
  status: "countdown" | "capturing" | "complete";
  currentShotIndex: number;
  shotCount: number;
}

export interface RoomState {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: ParticipantState[];
  session?: PublicSessionState;
}

export interface Membership {
  participantId: string;
  resumeToken: string;
  role: ParticipantRole;
  room: RoomState;
}

export type EventResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
