export type AccentKey = 'crimson' | 'gold' | 'blue' | 'purple' | 'green' | 'orange';
export type Mode = 'dark' | 'light';

export interface Accent {
  key: AccentKey;
  label: string;
  /** swatch color for the footer dot */
  swatch: string;
  /** rgb triplet used to build framer-motion glow strings */
  rgb: [number, number, number];
}

export const ACCENTS: Accent[] = [
  { key: 'crimson', label: 'Crimson', swatch: '#F43F5E', rgb: [244, 63, 94] },
  { key: 'gold',    label: 'Gold',    swatch: '#E8B84B', rgb: [232, 184, 75] },
  { key: 'blue',    label: 'Blue',    swatch: '#60A5FA', rgb: [96, 165, 250] },
  { key: 'purple',  label: 'Purple',  swatch: '#A78BFA', rgb: [167, 139, 250] },
  { key: 'green',   label: 'Green',   swatch: '#4ADE80', rgb: [74, 222, 128] },
  { key: 'orange',  label: 'Orange',  swatch: '#FB923C', rgb: [251, 146, 60] },
];

export const DEFAULT_ACCENT: AccentKey = 'crimson';
export const DEFAULT_MODE: Mode = 'dark';

export function accentByKey(key: AccentKey): Accent {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
}
