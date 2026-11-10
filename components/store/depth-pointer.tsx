"use client";

import { useEffect } from "react";

const MAX_TILT_DEG = 9;
const FINE_POINTER_WITH_MOTION =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Leans whichever `.tilt-3d` surface the pointer is over toward the pointer.
 * One delegated listener serves every card on the page, so the cards themselves
 * stay server-rendered. Touch screens never run this; the CSS turns cover them.
 */
export function DepthPointer() {
  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER_WITH_MOTION).matches) {
      return;
    }

    let active: HTMLElement | null = null;
    let rect: DOMRect | null = null;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const release = () => {
      if (!active) {
        return;
      }
      active.removeAttribute("data-tilting");
      for (const name of ["--rx", "--ry", "--gx", "--gy"]) {
        active.style.removeProperty(name);
      }
      active = null;
      rect = null;
    };

    const paint = () => {
      frame = 0;
      if (!(active && rect)) {
        return;
      }
      const x = clampUnit((pointerX - rect.left) / rect.width);
      const y = clampUnit((pointerY - rect.top) / rect.height);
      active.style.setProperty("--rx", `${(0.5 - y) * 2 * MAX_TILT_DEG}deg`);
      active.style.setProperty("--ry", `${(x - 0.5) * 2 * MAX_TILT_DEG}deg`);
      active.style.setProperty("--gx", `${x * 100}%`);
      active.style.setProperty("--gy", `${y * 100}%`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const surface =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".tilt-3d")
          : null;

      if (surface !== active) {
        release();
        if (surface) {
          active = surface;
          // Measured once, flat: reading it mid-tilt would feed back and jitter.
          rect = surface.getBoundingClientRect();
          surface.setAttribute("data-tilting", "");
        }
      }

      pointerX = event.clientX;
      pointerY = event.clientY;
      if (active && !frame) {
        frame = requestAnimationFrame(paint);
      }
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", release, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", release);
      cancelAnimationFrame(frame);
      release();
    };
  }, []);

  return null;
}
