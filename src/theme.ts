export const C = {
  bg: "#040810",
  surface: "rgba(0,180,216,0.04)",
  border: "rgba(0,180,216,0.15)",
  borderBright: "rgba(0,180,216,0.4)",
  accent: "#00B4D8",
  purple: "#7C3AED",
  amber: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
  text: "#E2F0FF",
  textSec: "#7A9BB5",
  textMuted: "#3A5470",
} as const;

export const TAG_COLORS: Record<string, string> = {
  DEV: C.accent,
  TECH: C.purple,
  NOTES: C.amber,
  PRODUCT: C.green,
  GTM: "#F97316",
  STRATEGY: C.red,
  AUDIT: C.textSec,
  MEETING: "#EC4899",
};
