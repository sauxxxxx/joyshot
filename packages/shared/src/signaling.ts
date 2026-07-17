import { z } from "zod";
import { roomCodeSchema } from "./room.js";

export interface SessionDescriptionData {
  type: "offer" | "answer";
  sdp?: string;
}

export interface IceCandidateData {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string | null;
}

export interface SignalingMessage<T> {
  roomCode: string;
  targetParticipantId: string;
  data: T;
}

export interface ForwardedSignalingMessage<T> {
  fromParticipantId: string;
  data: T;
}

export interface PeerReadyMessage {
  roomCode: string;
  targetParticipantId: string;
}

const signalingEnvelopeSchema = z.object({
  roomCode: roomCodeSchema,
  targetParticipantId: z.string().uuid(),
});

export const sessionDescriptionSchema = z.object({
  type: z.enum(["offer", "answer"]),
  sdp: z.string().max(100_000).optional(),
});

export const iceCandidateSchema = z.object({
  candidate: z.string().max(10_000),
  sdpMid: z.string().max(256).nullable(),
  sdpMLineIndex: z.number().int().nonnegative().nullable(),
  usernameFragment: z.string().max(256).nullable().optional(),
});

export const descriptionMessageSchema = signalingEnvelopeSchema.extend({ data: sessionDescriptionSchema });
export const candidateMessageSchema = signalingEnvelopeSchema.extend({ data: iceCandidateSchema });
export const peerReadyMessageSchema = signalingEnvelopeSchema;
