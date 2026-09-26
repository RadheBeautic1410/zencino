import type { CSSProperties } from "react";

/**
 * The hero object: a clear acrylic desk organizer, built from translucent
 * planes and turned by a CSS animation. It is deliberately not a photograph —
 * catalog art varies, while this renders identically every time, weighs
 * nothing and needs no client JavaScript.
 */

/** Where a pen stands in the tray, and what colour its barrel is. */
const pen = (x: string, colour: string, z = "0rem"): CSSProperties =>
  ({ "--pen": colour, "--x": x, "--z": z }) as CSSProperties;

const PENS = [
  { id: "ink", style: pen("calc(var(--w) * -0.37)", "oklch(0.52 0.2 26)") },
  {
    id: "marker",
    style: pen("calc(var(--w) * -0.29)", "oklch(0.45 0.13 250)", "1.2rem"),
  },
  {
    id: "pencil",
    style: pen("calc(var(--w) * -0.22)", "oklch(0.78 0.15 85)", "-1rem"),
  },
];

export function AcrylicScene() {
  return (
    <div
      aria-label="A clear acrylic desk organizer turning slowly, showing its divided compartments and polished edges"
      className="acrylic-stage"
      role="img"
    >
      <div className="acrylic-spin">
        <div className="acrylic-box">
          {/* Back half first, so the front wall tints everything behind it */}
          <span className="acrylic-back acrylic-face" />
          <span className="acrylic-face acrylic-left acrylic-side" />
          <span className="acrylic-face acrylic-right acrylic-side" />
          <span className="acrylic-face acrylic-floor" />
          <span className="acrylic-divider acrylic-face" />

          <span className="acrylic-block">
            <b />
            <b />
            <b />
            <b />
            <b />
          </span>

          {PENS.map((item) => (
            <span className="acrylic-pen" key={item.id} style={item.style}>
              <i />
              <i />
            </span>
          ))}

          <span className="acrylic-face acrylic-front" />

          {/* Cut edges sit above every wall */}
          <span className="acrylic-rim acrylic-rim-back acrylic-rim-x" />
          <span className="acrylic-rim acrylic-rim-front acrylic-rim-x" />
          <span className="acrylic-rim acrylic-rim-left acrylic-rim-z" />
          <span className="acrylic-rim acrylic-rim-right acrylic-rim-z" />
          <span className="acrylic-rim acrylic-rim-divider acrylic-rim-z" />
        </div>
      </div>

      <span aria-hidden className="acrylic-shadow" />
    </div>
  );
}
