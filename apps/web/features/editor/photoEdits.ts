export type PhotoFilter = "original" | "mono" | "warm" | "cool" | "vintage" | "contrast";

export interface PhotoEdit {
  source: string;
  filter: PhotoFilter;
  brightness: number;
  contrast: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface StripTextOptions {
  title?: string;
  caption?: string;
  logoSource?: string;
  brandColor?: string;
}

export function createPhotoEdit(source: string): PhotoEdit {
  return { source, filter: "original", brightness: 100, contrast: 100, zoom: 1, offsetX: 0, offsetY: 0 };
}

export function photoFilterCss(edit: PhotoEdit) {
  const presets: Record<PhotoFilter, string> = {
    original: "",
    mono: "grayscale(1)",
    warm: "sepia(.18) saturate(1.18) hue-rotate(-8deg)",
    cool: "saturate(.92) hue-rotate(12deg)",
    vintage: "sepia(.35) saturate(.78) contrast(.92)",
    contrast: "contrast(1.25) saturate(1.08)",
  };
  return `${presets[edit.filter]} brightness(${edit.brightness}%) contrast(${edit.contrast}%)`.trim();
}
