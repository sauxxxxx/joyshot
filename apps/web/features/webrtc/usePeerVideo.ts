"use client";

import type { ParticipantState } from "@photobooth/shared";
import { useEffect, useState } from "react";
import type { PhotoboothSocket } from "@/lib/socket";
import { getConfiguredIceServers } from "./iceServers";

interface UsePeerVideoOptions {
  localStream: MediaStream | null;
  participantId?: string;
  participants: ParticipantState[];
  role?: "host" | "guest";
  roomCode: string;
  socket: PhotoboothSocket;
}

export function usePeerVideo({ localStream, participantId, participants, role, roomCode, socket }: UsePeerVideoOptions) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const peerParticipant = participants.find((participant) => participant.id !== participantId && participant.connected);
  const peerId = peerParticipant?.id;
  const peerCameraReady = Boolean(peerParticipant?.cameraReady);

  useEffect(() => {
    if (!participantId || !peerId || !role || (!localStream && !peerCameraReady)) {
      setRemoteStream(null);
      return;
    }

    const peer = new RTCPeerConnection({ iceServers: getConfiguredIceServers() });
    const pendingCandidates: RTCIceCandidateInit[] = [];
    let makingOffer = false;
    let offerSent = false;
    let reconnectTimer: number | undefined;

    if (localStream) {
      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
    } else {
      peer.addTransceiver("video", { direction: "recvonly" });
    }
    peer.ontrack = (event) => setRemoteStream(event.streams[0] ?? new MediaStream([event.track]));
    peer.onconnectionstatechange = () => {
      setConnectionState(peer.connectionState);
      if (peer.connectionState === "failed" && role === "host") {
        offerSent = false;
        void sendOffer(true);
      } else if (peer.connectionState === "disconnected" && role === "host") {
        reconnectTimer = window.setTimeout(() => {
          if (peer.connectionState === "disconnected") {
            offerSent = false;
            void sendOffer(true);
          }
        }, 2_000);
      }
    };
    peer.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      socket.emit("webrtc:ice-candidate", {
        roomCode,
        targetParticipantId: peerId,
        data: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragment: candidate.usernameFragment,
        },
      });
    };

    const flushCandidates = async () => {
      while (pendingCandidates.length > 0) {
        const candidate = pendingCandidates.shift();
        if (candidate) await peer.addIceCandidate(candidate).catch(() => undefined);
      }
    };
    const sendOffer = async (iceRestart = false) => {
      if (role !== "host" || makingOffer || (offerSent && !iceRestart) || peer.signalingState !== "stable") return;
      makingOffer = true;
      try {
        const offer = await peer.createOffer({ iceRestart });
        await peer.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          roomCode,
          targetParticipantId: peerId,
          data: { type: "offer", sdp: offer.sdp },
        });
        offerSent = true;
      } finally {
        makingOffer = false;
      }
    };
    const handlePeerReady = ({ fromParticipantId }: { fromParticipantId: string }) => {
      if (fromParticipantId === peerId) void sendOffer();
    };
    const handleOffer = async ({ fromParticipantId, data }: { fromParticipantId: string; data: RTCSessionDescriptionInit }) => {
      if (role !== "guest" || fromParticipantId !== peerId) return;
      await peer.setRemoteDescription(data);
      await flushCandidates();
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc:answer", {
        roomCode,
        targetParticipantId: peerId,
        data: { type: "answer", sdp: answer.sdp },
      });
    };
    const handleAnswer = async ({ fromParticipantId, data }: { fromParticipantId: string; data: RTCSessionDescriptionInit }) => {
      if (role !== "host" || fromParticipantId !== peerId || peer.signalingState !== "have-local-offer") return;
      await peer.setRemoteDescription(data);
      await flushCandidates();
    };
    const handleCandidate = async ({ fromParticipantId, data }: { fromParticipantId: string; data: RTCIceCandidateInit }) => {
      if (fromParticipantId !== peerId) return;
      if (!peer.remoteDescription) pendingCandidates.push(data);
      else await peer.addIceCandidate(data).catch(() => undefined);
    };

    socket.on("webrtc:ready", handlePeerReady);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleCandidate);
    socket.emit("webrtc:ready", { roomCode, targetParticipantId: peerId });
    const fallbackTimer = role === "host" ? window.setTimeout(() => void sendOffer(), 1_200) : undefined;

    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket.off("webrtc:ready", handlePeerReady);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleCandidate);
      peer.close();
      setRemoteStream(null);
    };
  }, [localStream, participantId, peerCameraReady, peerId, role, roomCode, socket]);

  return { connectionState, remoteStream };
}
