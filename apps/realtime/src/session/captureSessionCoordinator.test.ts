import { describe, expect, it } from "vitest";
import type { ActiveSession } from "../room/roomTypes.js";
import { shouldCancelCapture } from "./captureSessionCoordinator.js";

function createSession(currentShotIndex: number, captures = new Map()): ActiveSession {
  return {
    id: "session-1",
    status: "capturing",
    currentShotIndex,
    shotCount: 4,
    captures,
  };
}

describe("capture timeout guard", () => {
  it("does not let an earlier shot timeout cancel a later shot", () => {
    expect(shouldCancelCapture(createSession(3), "session-1", 0)).toBe(false);
  });

  it("cancels only when the matching active shot is still incomplete", () => {
    expect(shouldCancelCapture(createSession(3), "session-1", 3)).toBe(true);

    const completeRound = new Map([[3, new Map([
      ["host", { participantId: "host", image: new ArrayBuffer(1) }],
      ["guest", { participantId: "guest", image: new ArrayBuffer(1) }],
    ])]]);
    expect(shouldCancelCapture(createSession(3, completeRound), "session-1", 3)).toBe(false);
  });
});
