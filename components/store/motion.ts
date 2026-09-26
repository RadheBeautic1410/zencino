import type { CSSProperties } from "react";

/**
 * Custom properties read by the motion utilities in `globals.css`. Passing the
 * timing as a variable keeps the animations declarative — sections stay server
 * components and no class has to exist per delay.
 */

/** Entrance delay for `.intro`, `.intro-media` and `.intro-rule`. */
export const delay = (ms: number) =>
  ({ "--delay": `${ms}ms` }) as CSSProperties;

/** A grid child's position, which staggers its scroll-driven reveal. */
export const order = (i: number) => ({ "--i": i }) as CSSProperties;

/** Word index plus the line's own delay, for the headline reveal. */
export const wordStep = (i: number, base: number) =>
  ({ "--i": i, "--delay": `${base}ms` }) as CSSProperties;

/** Travel distance for a scroll-linked decorative layer. */
export const travel = (from: string, to: string) =>
  ({ "--from": from, "--to": to }) as CSSProperties;
