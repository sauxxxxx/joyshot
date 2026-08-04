export interface EventProfile {
  name: string;
  caption: string;
  brandColor: string;
  logoSource?: string;
  retentionHours: 24 | 168 | 0;
}

const KEY = "joyshot-active-event";
export const defaultEventProfile: EventProfile = { name: "Our celebration", caption: "THANKS FOR CELEBRATING WITH US", brandColor: "#f05a67", retentionHours: 24 };

export function readEventProfile(): EventProfile | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null") as EventProfile | null; } catch { return null; }
}

export function storeEventProfile(profile: EventProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearEventProfile() { localStorage.removeItem(KEY); }
