import type { Membership } from "@photobooth/shared";

interface StoredMembership {
  participantId: string;
  resumeToken: string;
  role: Membership["role"];
}

const keyFor = (roomCode: string) => `joyshot:room:${roomCode}`;

export function storeMembership(membership: Membership) {
  const stored: StoredMembership = {
    participantId: membership.participantId,
    resumeToken: membership.resumeToken,
    role: membership.role,
  };
  sessionStorage.setItem(keyFor(membership.room.code), JSON.stringify(stored));
}

export function readMembership(roomCode: string): StoredMembership | undefined {
  const value = sessionStorage.getItem(keyFor(roomCode));
  if (!value) return undefined;
  try {
    return JSON.parse(value) as StoredMembership;
  } catch {
    sessionStorage.removeItem(keyFor(roomCode));
    return undefined;
  }
}

export function clearMembership(roomCode: string) {
  sessionStorage.removeItem(keyFor(roomCode));
}
