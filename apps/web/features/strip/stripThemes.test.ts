import { describe, expect, it } from "vitest";
import { stripThemes } from "./stripThemes";

describe("strip frame collection", () => {
  it("offers ten distinct designed frames", () => {
    const themes = Object.values(stripThemes);
    expect(themes).toHaveLength(10);
    expect(new Set(themes.map(({ motif }) => motif)).size).toBe(10);
    expect(new Set(themes.map(({ label }) => label)).size).toBe(10);
  });

  it("keeps the collection within the restrained JoyShot palette", () => {
    for (const theme of Object.values(stripThemes)) {
      expect(theme.background).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.label.length).toBeGreaterThan(4);
      expect(theme.description.length).toBeGreaterThan(12);
    }
  });
});
