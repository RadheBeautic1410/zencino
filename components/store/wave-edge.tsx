import { cn } from "@/lib/utils";

/**
 * Wave geometry per edge. `echo` is the pale outrider that breaks the
 * silhouette; `fill` is the band's own edge, drawn over it. Both close off
 * towards the band so the shape stays a solid extension of it.
 */
const EDGES = {
  top: {
    echo: "M0,54 C150,92 306,116 470,100 C654,82 770,10 962,4 C1134,8 1292,30 1440,46 L1440,140 L0,140 Z",
    fill: "M0,86 C152,114 300,134 468,118 C656,100 772,44 962,40 C1134,44 1292,64 1440,84 L1440,140 L0,140 Z",
  },
  bottom: {
    echo: "M0,86 C150,48 306,24 470,40 C654,58 770,130 962,136 C1134,132 1292,110 1440,94 L1440,0 L0,0 Z",
    fill: "M0,54 C152,26 300,6 468,22 C656,40 772,96 962,100 C1134,96 1292,76 1440,56 L1440,0 L0,0 Z",
  },
} as const;

/**
 * Organic cap that lets a full-bleed colour band meet the page on a curve
 * instead of a ruled line. Colour comes from `currentColor`, so a caller sets
 * one text class on the wrapper and both caps match the band between them.
 */
export function WaveEdge({
  className,
  side,
}: {
  className?: string;
  side: "top" | "bottom";
}) {
  const edge = EDGES[side];

  return (
    <svg
      aria-hidden
      className={cn(
        "block h-[clamp(2.25rem,5.5vw,6.5rem)] w-full",
        /* Overlaps the band by a hair — otherwise subpixel rounding
           leaves a light hairline along the seam. */
        side === "top" ? "-mb-px" : "-mt-px",
        className
      )}
      preserveAspectRatio="none"
      viewBox="0 0 1440 140"
    >
      <path className="fill-current opacity-30" d={edge.echo} />
      <path className="fill-current" d={edge.fill} />
    </svg>
  );
}
