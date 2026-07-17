import { describe, expect, it } from "vitest";
import { calculateCoverCrop } from "./captureFrame";

describe("calculateCoverCrop", () => {
  it("crops a wide source from both horizontal edges", () => {
    expect(calculateCoverCrop(1920, 1080, 720, 540)).toEqual({
      sx: 240,
      sy: 0,
      sw: 1440,
      sh: 1080,
    });
  });

  it("crops a tall source from both vertical edges", () => {
    expect(calculateCoverCrop(720, 1280, 720, 540)).toEqual({
      sx: 0,
      sy: 370,
      sw: 720,
      sh: 540,
    });
  });
});
