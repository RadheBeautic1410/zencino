"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR =
  ".reveal, .reveal-soft, .reveal-media, .reveal-item, .reveal-words";

/**
 * Plays each section's entrance the moment it reaches the screen, and keeps the
 * waves moving only while they are visible.
 *
 * Only elements still below the fold are ever hidden, and only from here. So
 * nothing flashes on load, and a page whose script fails simply stays visible.
 */
export function ScrollMotion() {
  useEffect(() => {
    const waves = document.querySelectorAll<SVGSVGElement>("svg[data-wave]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const wave of waves) {
        wave.pauseAnimations();
      }
      return;
    }

    const waveObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const wave = entry.target as SVGSVGElement;
        if (entry.isIntersecting) {
          wave.unpauseAnimations();
        } else {
          wave.pauseAnimations();
        }
      }
    });
    for (const wave of waves) {
      waveObserver.observe(wave);
    }

    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Anything already scrolled past settles too, or a jump down the page
        // would leave it waiting to play on the way back up.
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          entry.target.setAttribute("data-reveal", "go");
          revealObserver.unobserve(entry.target);
        }
      }
    });

    const waiting: Element[] = [];
    for (const element of document.querySelectorAll(REVEAL_SELECTOR)) {
      if (element.getBoundingClientRect().top >= window.innerHeight) {
        element.setAttribute("data-reveal", "wait");
        revealObserver.observe(element);
        waiting.push(element);
      }
    }

    return () => {
      waveObserver.disconnect();
      revealObserver.disconnect();
      for (const element of waiting) {
        element.removeAttribute("data-reveal");
      }
    };
  }, []);

  return null;
}
