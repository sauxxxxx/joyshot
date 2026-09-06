import type { StripThemeId } from "@/features/strip/stripThemes";

export interface EventProfile {
  name: string;
  caption: string;
  brandColor: string;
  logoSource?: string;
  retentionHours: 24 | 168 | 0;
  frame: StripThemeId;
}

const KEY = "joyshot-active-event";
export const defaultEventProfile: EventProfile = { name: "Our celebration", caption: "THANKS FOR CELEBRATING WITH US", brandColor: "#8f1d2c", retentionHours: 24, frame: "classic" };

export function readEventProfile(): EventProfile | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<EventProfile> | null;
    return stored ? { ...defaultEventProfile, ...stored } : null;
  } catch { return null; }
}

export function storeEventProfile(profile: EventProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearEventProfile() { localStorage.removeItem(KEY); }
