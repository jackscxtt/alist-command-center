import type { CSSProperties, ReactNode } from "react";
import { C } from "../theme";

interface PanelProps {
  title: string;
  children: ReactNode;
  accent?: string;
  action?: ReactNode;
  style?: CSSProperties;
}

export function Panel({ title, children, accent = C.accent, action, style }: PanelProps) {
  return (
    <div
      style={{
        background: "rgba(2,8,20,0.85)",
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${accent}`,
        borderRadius: "4px",
        padding: "16px",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.22em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
