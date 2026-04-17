import { C } from "../theme";

export function Badge({ label, color }: { label: string; color?: string }) {
  const c = color || C.accent;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        color: c,
        border: `1px solid ${c}`,
        padding: "1px 6px",
        borderRadius: "2px",
        opacity: 0.9,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
