import { describe, expect, it } from "vitest";
import { generateRoomCode } from "./generateRoomCode.js";

describe("generateRoomCode", () => {
  it("creates a six-character non-ambiguous code", () => {
    expect(generateRoomCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/u);
  });

  it("does not produce one repeated value", () => {
    expect(new Set(Array.from({ length: 20 }, generateRoomCode)).size).toBeGreaterThan(1);
  });
});
