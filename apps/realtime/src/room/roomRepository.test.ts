import { describe, expect, it } from "vitest";
import { RoomError, RoomRepository } from "./roomRepository.js";

describe("RoomRepository", () => {
  it("creates a host and accepts one guest", () => {
    const rooms = new RoomRepository(60_000, 1_000);
    const host = rooms.create("host-socket");
    const guest = rooms.join(host.room.code, "guest-socket");

    expect(host.role).toBe("host");
    expect(guest.role).toBe("guest");
    expect(guest.room.participants).toHaveLength(2);
  });

  it("rejects a third participant", () => {
    const rooms = new RoomRepository(60_000, 1_000);
    const host = rooms.create("host-socket");
    rooms.join(host.room.code, "guest-socket");

    expect(() => rooms.join(host.room.code, "third-socket")).toThrowError(RoomError);
  });

  it("reconnects a participant using its opaque token", () => {
    const rooms = new RoomRepository(60_000, 5_000);
    const host = rooms.create("old-socket");
    rooms.markDisconnected("old-socket", () => undefined);
    const resumed = rooms.join(host.room.code, "new-socket", host.resumeToken);

    expect(resumed.participantId).toBe(host.participantId);
    expect(resumed.room.participants[0]?.connected).toBe(true);
  });

  it("becomes ready only when both cameras and people are ready", () => {
    const rooms = new RoomRepository(60_000, 1_000);
    const hostMembership = rooms.create("host-socket");
    rooms.join(hostMembership.room.code, "guest-socket");
    const room = rooms.get(hostMembership.room.code)!;
    room.participants.forEach((participant) => {
      participant.cameraReady = true;
      participant.ready = true;
    });
    rooms.refreshStatus(room);

    expect(room.status).toBe("ready");
  });
});
