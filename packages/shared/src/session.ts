import { z } from "zod";
import { roomCodeSchema } from "./room.js";

export interface CaptureSchedule {
  roomCode: string;
  sessionId: string;
  shotIndex: number;
  countdownStartsAt: number;
  captureAt: number;
}

export interface CaptureImage {
  participantId: string;
  image: ArrayBuffer;
}

export interface CapturePair {
  sessionId: string;
  shotIndex: number;
  images: CaptureImage[];
}

export interface SessionComplete {
  sessionId: string;
  participantOrder: string[];
}

export const sessionStartSchema = z.object({ roomCode: roomCodeSchema });

export const captureSubmitSchema = z.object({
  roomCode: roomCodeSchema,
  sessionId: z.string().uuid(),
  shotIndex: z.number().int().min(0).max(3),
  image: z.instanceof(ArrayBuffer),
});
