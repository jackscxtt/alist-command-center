export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <div
      style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        animation: pulse ? "pulseDot 2s infinite" : "none",
      }}
    />
  );
}
