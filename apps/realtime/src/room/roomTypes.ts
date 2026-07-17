import type { ParticipantRole, RoomStatus } from "@photobooth/shared";

export interface RoomParticipant {
  id: string;
  resumeToken: string;
  socketId: string;
  role: ParticipantRole;
  connected: boolean;
  cameraReady: boolean;
  ready: boolean;
  joinedAt: number;
  disconnectedAt?: number;
}

export interface StoredCapture {
  participantId: string;
  image: ArrayBuffer;
}

export interface ActiveSession {
  id: string;
  status: "countdown" | "capturing" | "complete";
  currentShotIndex: number;
  shotCount: number;
  captures: Map<number, Map<string, StoredCapture>>;
}

export interface ActiveRoom {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Map<string, RoomParticipant>;
  session?: ActiveSession;
  createdAt: number;
  expiresAt: number;
}
