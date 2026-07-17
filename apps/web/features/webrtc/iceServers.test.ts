import { describe, expect, it } from "vitest";
import { createIceServers } from "./iceServers";

describe("createIceServers", () => {
  it("uses STUN only when TURN credentials are incomplete", () => {
    expect(createIceServers({ turnUrl: "turn:relay.example.com:3478" })).toEqual([
      { urls: "stun:stun.l.google.com:19302" },
    ]);
  });

  it("adds comma-separated TURN endpoints with credentials", () => {
    expect(createIceServers({
      stunUrl: "stun:stun.example.com:3478",
      turnUrl: "turn:relay.example.com:3478, turns:relay.example.com:443",
      turnUsername: "user",
      turnCredential: "secret",
    })).toEqual([
      { urls: "stun:stun.example.com:3478" },
      {
        urls: ["turn:relay.example.com:3478", "turns:relay.example.com:443"],
        username: "user",
        credential: "secret",
      },
    ]);
  });
});
