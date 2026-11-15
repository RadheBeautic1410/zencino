"use client";

import { CaretLeft, CaretRight, Check, Copy } from "@phosphor-icons/react";
import { type ReactNode, useRef, useState } from "react";

/**
 * A horizontal snap rail with round arrow buttons on either side. The cards
 * stay server-rendered children; only the scrolling needs the browser.
 */
export function LuxeRail({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);

  const step = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) {
      return;
    }
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        aria-label="Previous products"
        className="luxe-rail-arrow -left-3 md:-left-5"
        onClick={() => step(-1)}
        type="button"
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      <div
        className="luxe-rail -my-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 py-6"
        ref={track}
      >
        {children}
      </div>

      <button
        aria-label="Next products"
        className="luxe-rail-arrow -right-3 md:-right-5"
        onClick={() => step(1)}
        type="button"
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </div>
  );
}

/** The coupon code in a dashed chip, copied to the clipboard on click. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the code is still on screen to type.
    }
  };

  return (
    <button
      aria-label={`Copy coupon code ${code}`}
      className="group inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-white/60 px-5 py-2.5 text-sm text-foreground transition-colors hover:border-primary/60"
      onClick={copy}
      type="button"
    >
      Use Code:
      <span className="font-heading text-xl font-bold tracking-wide text-gold-deep">
        {code}
      </span>
      {copied ? (
        <Check className="text-success" size={18} weight="bold" />
      ) : (
        <Copy
          className="text-primary/60 transition-colors group-hover:text-primary"
          size={18}
        />
      )}
    </button>
  );
}
