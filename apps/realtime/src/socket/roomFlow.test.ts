import type { AddressInfo } from "node:net";
import type { ClientToServerEvents, Membership, ServerToClientEvents } from "@photobooth/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import { createRealtimeServer } from "../createRealtimeServer.js";

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type TestServer = ReturnType<typeof createRealtimeServer>;

describe("two-person room socket flow", () => {
  let server: TestServer;
  let url: string;
  const clients: TestClient[] = [];

  beforeEach(async () => {
    server = createRealtimeServer({
      webOrigin: "http://localhost:3000",
      roomTtlMs: 60_000,
      reconnectGraceMs: 2_000,
      maxImageBytes: 1_048_576,
    });
    await new Promise<void>((resolve) => server.httpServer.listen(0, "127.0.0.1", resolve));
    const address = server.httpServer.address() as AddressInfo;
    url = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    await new Promise<void>((resolve) => server.io.close(() => resolve()));
  });

  async function connect() {
    const client: TestClient = createClient(url, { transports: ["websocket"], forceNew: true });
    clients.push(client);
    if (!client.connected) await new Promise<void>((resolve) => client.once("connect", () => resolve()));
    return client;
  }

  it("creates a room, joins a guest, and rejects a third person", async () => {
    const host = await connect();
    const guest = await connect();
    const third = await connect();
    const membership = await new Promise<Membership>((resolve, reject) => {
      host.emit("room:create", (result) => result.ok ? resolve(result.data) : reject(new Error(result.error.message)));
    });
    const guestMembership = await new Promise<Membership>((resolve, reject) => {
      guest.emit("room:join", { roomCode: membership.room.code }, (result) => result.ok ? resolve(result.data) : reject(new Error(result.error.message)));
    });
    const rejected = await new Promise<boolean>((resolve) => {
      third.emit("room:join", { roomCode: membership.room.code }, (result) => resolve(!result.ok && result.error.code === "ROOM_FULL"));
    });

    expect(guestMembership.room.participants).toHaveLength(2);
    expect(rejected).toBe(true);

    const peerReady = new Promise<string>((resolve) => host.once("webrtc:ready", ({ fromParticipantId }) => resolve(fromParticipantId)));
    guest.emit("webrtc:ready", { roomCode: membership.room.code, targetParticipantId: membership.participantId });
    await expect(peerReady).resolves.toBe(guestMembership.participantId);
  });

  it("starts only after both participants are camera-ready and ready", async () => {
    const host = await connect();
    const guest = await connect();
    const membership = await new Promise<Membership>((resolve) => {
      host.emit("room:create", (result) => { if (result.ok) resolve(result.data); });
    });
    await new Promise<void>((resolve) => {
      guest.emit("room:join", { roomCode: membership.room.code }, () => resolve());
    });
    await new Promise<void>((resolve, reject) => {
      host.emit("room:settings", { roomCode: membership.room.code, countdownSeconds: 3, layout: "grid" }, (result) => {
        if (result.ok) resolve();
        else reject(new Error(result.error.message));
      });
    });
    for (const client of [host, guest]) {
      await new Promise<void>((resolve) => {
        client.emit("participant:presence", { roomCode: membership.room.code, cameraReady: true, ready: true }, () => resolve());
      });
    }

    const scheduled = new Promise<{ sessionId: string; shotIndex: number; captureAt: number }>((resolve) =>
      host.once("capture:scheduled", (event) => resolve(event)),
    );
    const started = await new Promise<boolean>((resolve) => {
      host.emit("session:start", { roomCode: membership.room.code }, (result) => resolve(result.ok));
    });

    expect(started).toBe(true);
    expect(server.rooms.get(membership.room.code)?.settings).toEqual({ countdownSeconds: 3, layout: "grid" });
    const capture = await scheduled;
    expect(capture.shotIndex).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, capture.captureAt - Date.now()) + 50));

    const pairReady = new Promise<number>((resolve) => host.once("capture:pair-ready", (pair) => resolve(pair.images.length)));
    for (const client of [host, guest]) {
      await new Promise<void>((resolve, reject) => {
        client.emit("capture:submit", {
          roomCode: membership.room.code,
          sessionId: capture.sessionId,
          shotIndex: 0,
          image: new Uint8Array([1, 2, 3]).buffer,
        }, (result) => result.ok ? resolve() : reject(new Error(result.error.message)));
      });
    }
    await expect(pairReady).resolves.toBe(2);
  });

  it("resets a completed booth without starting another countdown", async () => {
    const host = await connect();
    const guest = await connect();
    const membership = await new Promise<Membership>((resolve) => {
      host.emit("room:create", (result) => { if (result.ok) resolve(result.data); });
    });
    await new Promise<void>((resolve) => {
      guest.emit("room:join", { roomCode: membership.room.code }, () => resolve());
    });

    const room = server.rooms.get(membership.room.code)!;
    for (const participant of room.participants.values()) {
      participant.cameraReady = true;
      participant.ready = true;
    }
    room.session = {
      id: "session-complete",
      status: "complete",
      currentShotIndex: 3,
      shotCount: 4,
      captures: new Map(),
    };
    room.status = "complete";

    let scheduled = false;
    host.once("capture:scheduled", () => { scheduled = true; });
    const nextState = new Promise<Membership["room"]>((resolve) => {
      guest.once("room:state", resolve);
    });
    const reset = await new Promise<boolean>((resolve) => {
      host.emit("session:reset", { roomCode: membership.room.code }, (result) => resolve(result.ok));
    });

    expect(reset).toBe(true);
    const state = await nextState;
    expect(state.status).toBe("waiting");
    expect(state.session).toBeUndefined();
    expect(state.participants.every((participant) => !participant.ready)).toBe(true);
    expect(scheduled).toBe(false);
  });
});
