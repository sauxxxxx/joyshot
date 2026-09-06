export const stripThemes = {
  classic: { label: "Studio Proof", description: "Cream stock with crop marks", background: "#f3efe5", foreground: "#2f2925", accent: "#8f2737", panel: "#dedbd3", badgeForeground: "#ffffff", motif: "proof" },
  gingham: { label: "Sunday Gingham", description: "Muted checks and ink notes", background: "#efe7dc", foreground: "#552c2e", accent: "#963844", panel: "#f8f2e8", badgeForeground: "#ffffff", motif: "gingham" },
  negative: { label: "Powder Negative", description: "Soft blue film perforations", background: "#cbd8db", foreground: "#27383d", accent: "#8f2737", panel: "#34464b", badgeForeground: "#ffffff", motif: "negative" },
  taped: { label: "Sage Tape", description: "Loose prints, neatly taped", background: "#dce1d5", foreground: "#34423b", accent: "#a86155", panel: "#f6f1e8", badgeForeground: "#ffffff", motif: "taped" },
  scrapbook: { label: "Lilac Scrapbook", description: "Layered paper and soft doodles", background: "#ded8e3", foreground: "#47384d", accent: "#8d596d", panel: "#f4efe8", badgeForeground: "#ffffff", motif: "scrapbook" },
  receipt: { label: "Photo Receipt", description: "Narrow, simple, date-stamped", background: "#eee9dd", foreground: "#302d29", accent: "#697f78", panel: "#faf8f1", badgeForeground: "#ffffff", motif: "receipt" },
  editorial: { label: "Oxblood Cutout", description: "Magazine blocks and sharp type", background: "#8a2d3b", foreground: "#fff8ed", accent: "#d8b6a8", panel: "#f4eadf", badgeForeground: "#51202a", motif: "editorial" },
  postcard: { label: "Peach Postcard", description: "A soft note from right now", background: "#ead4c5", foreground: "#543b36", accent: "#8b5360", panel: "#f7eee5", badgeForeground: "#ffffff", motif: "postcard" },
  notebook: { label: "Blue Notebook", description: "Graph lines and margin marks", background: "#e6e9e5", foreground: "#33424c", accent: "#718f9d", panel: "#f8f5ed", badgeForeground: "#ffffff", motif: "notebook" },
  zine: { label: "Soft Copy Zine", description: "Photocopied edges, calmer ink", background: "#d5d1ca", foreground: "#242220", accent: "#80666e", panel: "#efede6", badgeForeground: "#ffffff", motif: "zine" },
} as const;

export type StripThemeId = keyof typeof stripThemes;
export type StripTheme = (typeof stripThemes)[StripThemeId];
