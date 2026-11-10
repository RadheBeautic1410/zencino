import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * One loop of the wave, as poses with identical commands so the browser can
 * morph between them. Drawn for a top edge and closed off towards the band; a
 * bottom edge is the same drawing flipped.
 */
const WAVE_POSES = [
  "M0,50C69,50 69,88 137,88C177,88 177,57 216,57C296,57 296,86 375,86C429,86 429,53 483,53C532,53 532,94 581,94C663,94 663,44 744,44C786,44 786,99 827,99C891,99 891,45 954,45C1028,45 1028,92 1101,92C1139,92 1139,54 1177,54C1254,54 1254,85 1330,85C1385,85 1385,56 1440,56V140H0Z",
  "M0,57C55,57 55,85 110,85C171,85 171,53 231,53C307,53 307,93 382,93C420,93 420,45 458,45C533,45 533,99 607,99C670,99 670,45 732,45C775,45 775,93 817,93C899,93 899,53 980,53C1028,53 1028,85 1076,85C1131,85 1131,57 1186,57C1265,57 1265,88 1344,88C1392,88 1392,49 1440,49V140H0Z",
  "M0,54C48,54 48,92 96,92C177,92 177,45 258,45C308,45 308,99 358,99C411,99 411,44 464,44C544,44 544,94 624,94C664,94 664,53 704,53C771,53 771,86 838,86C908,86 908,57 978,57C1017,57 1017,88 1056,88C1135,88 1135,50 1214,50C1269,50 1269,96 1324,96C1382,96 1382,43 1440,43V140H0Z",
  "M0,46C58,46 58,99 116,99C188,99 188,44 260,44C299,44 299,95 337,95C415,95 415,52 492,52C550,52 550,86 607,86C653,86 653,57 698,57C780,57 780,87 862,87C907,87 907,51 951,51C1011,51 1011,96 1070,96C1147,96 1147,43 1223,43C1261,43 1261,99 1299,99C1370,99 1370,47 1440,47V140H0Z",
  "M0,43C71,43 71,96 141,96C188,96 188,51 234,51C291,51 291,87 347,87C426,87 426,57 504,57C543,57 543,86 581,86C652,86 652,52 723,52C789,52 789,95 855,95C896,95 896,44 936,44C1017,44 1017,99 1097,99C1149,99 1149,46 1200,46C1252,46 1252,92 1303,92C1372,92 1372,55 1440,55V140H0Z",
];

/* Back to the first pose, so the loop has no seam. */
const WAVE_LOOP = [...WAVE_POSES, WAVE_POSES[0]].join(";");

const WAVE_SECONDS = "1s";
/* The echo runs behind the band's own edge, out of step with it. */
const ECHO_START = "-0.35s";

const CUT_HEIGHT = "clamp(1.75rem, 4vw, 4rem)";

/* The first pose inverted: what stays is everything above each curve. */
const CUT_SHAPE =
  "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 140' preserveAspectRatio='none'%3E%3Cpath fill-opacity='.7' d='M0,0H1440V56C1385,56 1385,85 1330,85C1254,85 1254,54 1177,54C1139,54 1139,92 1101,92C1028,92 1028,45 954,45C891,45 891,99 827,99C786,99 786,44 744,44C663,44 663,94 581,94C532,94 532,53 483,53C429,53 429,86 375,86C296,86 296,57 216,57C177,57 177,88 137,88C69,88 69,50 0,50Z'/%3E%3Cpath d='M0,0H1440V40C1385,40 1385,69 1330,69C1254,69 1254,38 1177,38C1139,38 1139,76 1101,76C1028,76 1028,29 954,29C891,29 891,83 827,83C786,83 786,28 744,28C663,28 663,78 581,78C532,78 532,37 483,37C429,37 429,70 375,70C296,70 296,41 216,41C177,41 177,72 137,72C69,72 69,34 0,34Z'/%3E%3C/svg%3E";

/**
 * Cuts a panel's bottom edge along the wave. A mask rather than a drawn
 * `WaveEdge`, because a band's grain and glow make it lighter than a flat fill:
 * here the band itself shows through, so no step appears where they meet.
 */
export const waveCutBottom: CSSProperties = {
  maskImage: `url("data:image/svg+xml,${CUT_SHAPE}"), linear-gradient(#000, #000)`,
  maskPosition: "bottom, top",
  maskRepeat: "no-repeat",
  maskSize: `100% ${CUT_HEIGHT}, 100% calc(100% - ${CUT_HEIGHT} + 1px)`,
};

/**
 * Organic cap that lets a full-bleed colour band meet the page on a curve
 * instead of a ruled line. Colour comes from `currentColor`, so a caller sets
 * one text class on the wrapper and both caps match the band between them.
 *
 * SMIL rather than CSS, because Safari cannot animate a path's shape from CSS.
 * `ScrollMotion` pauses it off screen and under reduced motion.
 */
export function WaveEdge({
  className,
  side,
}: {
  className?: string;
  side: "top" | "bottom";
}) {
  return (
    <svg
      aria-hidden
      className={cn(
        "block h-[clamp(2.25rem,5.5vw,6.5rem)] w-full",
        /* Overlaps the band by a hair — otherwise subpixel rounding
           leaves a light hairline along the seam. */
        side === "top" ? "-mb-px" : "-mt-px -scale-y-100",
        className
      )}
      data-wave
      preserveAspectRatio="none"
      viewBox="0 0 1440 140"
    >
      <path
        className="fill-current opacity-30"
        d={WAVE_POSES[0]}
        transform="translate(0 -16)"
      >
        <animate
          attributeName="d"
          begin={ECHO_START}
          dur={WAVE_SECONDS}
          repeatCount="indefinite"
          values={WAVE_LOOP}
        />
      </path>
      <path className="fill-current" d={WAVE_POSES[0]}>
        <animate
          attributeName="d"
          dur={WAVE_SECONDS}
          repeatCount="indefinite"
          values={WAVE_LOOP}
        />
      </path>
    </svg>
  );
}
