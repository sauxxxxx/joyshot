import { describe, expect, it } from "vitest";
import { calculatePhotoLayout } from "./photoLayouts";

describe("photo layouts", () => {
  it.each(["strip", "grid", "postcard", "film"] as const)("creates four frames for %s", (layoutId) => {
    const layout = calculatePhotoLayout(4, layoutId);
    expect(layout.frames).toHaveLength(4);
    expect(layout.frames.every((frame) => frame.width > 0 && frame.height > 0)).toBe(true);
    expect(layout.height).toBeGreaterThan(layout.header + layout.footer);
  });

  it("creates eight frames for a combined room layout", () => {
    expect(calculatePhotoLayout(8, "grid").frames).toHaveLength(8);
  });
});
