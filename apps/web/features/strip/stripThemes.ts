export const stripThemes = {
  classic: {
    label: "Classic Booth",
    background: "#fffdf9",
    foreground: "#182033",
    accent: "#f05a67",
    panel: "#f5eee8",
  },
  pink: {
    label: "Pink Pop",
    background: "#f05a67",
    foreground: "#ffffff",
    accent: "#ffd166",
    panel: "#ffd9de",
  },
  midnight: {
    label: "Midnight",
    background: "#182033",
    foreground: "#fff8f1",
    accent: "#9d87ff",
    panel: "#2b3450",
  },
} as const;

export type StripThemeId = keyof typeof stripThemes;
