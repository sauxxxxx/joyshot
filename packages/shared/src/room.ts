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

export const boothSettingsSchema = z.object({
  countdownSeconds: z.union([z.literal(3), z.literal(5), z.literal(10)]),
  layout: z.enum(["strip", "grid", "postcard", "film"]),
});

export const roomSettingsSchema = boothSettingsSchema.extend({ roomCode: roomCodeSchema });

export type CountdownSeconds = 3 | 5 | 10;
export type PhotoLayoutId = "strip" | "grid" | "postcard" | "film";
export interface BoothSettings { countdownSeconds: CountdownSeconds; layout: PhotoLayoutId; }

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
  settings: BoothSettings;
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
