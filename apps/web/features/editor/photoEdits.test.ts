import { describe, expect, it } from "vitest";
import { createPhotoEdit, photoFilterCss } from "./photoEdits";

describe("photo edits", () => {
  it("creates a non-destructive default edit", () => {
    expect(createPhotoEdit("photo.jpg")).toEqual({
      source: "photo.jpg", filter: "original", brightness: 100, contrast: 100, zoom: 1, offsetX: 0, offsetY: 0,
    });
  });

  it("combines a preset with brightness and contrast", () => {
    expect(photoFilterCss({ ...createPhotoEdit("photo.jpg"), filter: "mono", brightness: 90 }))
      .toContain("grayscale(1) brightness(90%) contrast(100%)");
  });
});
