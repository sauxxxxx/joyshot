import type { CapturePair, CaptureSchedule, SessionComplete } from "./session.js";
import type { EventResult, Membership, RoomState } from "./room.js";
import type {
  ForwardedSignalingMessage,
  IceCandidateData,
  PeerReadyMessage,
  SessionDescriptionData,
  SignalingMessage,
} from "./signaling.js";

export interface ClientToServerEvents {
  "room:create": (callback: (result: EventResult<Membership>) => void) => void;
  "room:join": (
    payload: { roomCode: string; resumeToken?: string },
    callback: (result: EventResult<Membership>) => void,
  ) => void;
  "room:leave": (payload: { roomCode: string }) => void;
  "participant:presence": (
    payload: { roomCode: string; cameraReady?: boolean; ready?: boolean },
    callback: (result: EventResult<RoomState>) => void,
  ) => void;
  "session:start": (
    payload: { roomCode: string },
    callback: (result: EventResult<{ sessionId: string }>) => void,
  ) => void;
  "capture:submit": (
    payload: { roomCode: string; sessionId: string; shotIndex: number; image: ArrayBuffer },
    callback: (result: EventResult<{ accepted: true }>) => void,
  ) => void;
  "webrtc:offer": (payload: SignalingMessage<SessionDescriptionData>) => void;
  "webrtc:answer": (payload: SignalingMessage<SessionDescriptionData>) => void;
  "webrtc:ice-candidate": (payload: SignalingMessage<IceCandidateData>) => void;
  "webrtc:ready": (payload: PeerReadyMessage) => void;
  "time:ping": (clientSentAt: number, callback: (serverTime: number) => void) => void;
}

export interface ServerToClientEvents {
  "server:ready": (payload: { connectedAt: number }) => void;
  "room:state": (state: RoomState) => void;
  "room:closed": (payload: { message: string }) => void;
  "capture:scheduled": (schedule: CaptureSchedule) => void;
  "capture:pair-ready": (pair: CapturePair) => void;
  "session:complete": (payload: SessionComplete) => void;
  "session:cancelled": (payload: { message: string }) => void;
  "webrtc:offer": (payload: ForwardedSignalingMessage<SessionDescriptionData>) => void;
  "webrtc:answer": (payload: ForwardedSignalingMessage<SessionDescriptionData>) => void;
  "webrtc:ice-candidate": (payload: ForwardedSignalingMessage<IceCandidateData>) => void;
  "webrtc:ready": (payload: { fromParticipantId: string }) => void;
}

export const socketEvents = {
  roomCreate: "room:create",
  roomJoin: "room:join",
  roomState: "room:state",
  participantPresence: "participant:presence",
  sessionStart: "session:start",
  captureScheduled: "capture:scheduled",
  captureSubmit: "capture:submit",
  capturePairReady: "capture:pair-ready",
  sessionComplete: "session:complete",
  webrtcOffer: "webrtc:offer",
  webrtcAnswer: "webrtc:answer",
  webrtcIceCandidate: "webrtc:ice-candidate",
  webrtcReady: "webrtc:ready",
} as const;
