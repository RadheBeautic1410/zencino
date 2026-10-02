"use client";

import { ArrowLeft, ArrowRight, Star } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";
import type { Testimonial } from "@/components/store/home-sections";

const STAR_POSITIONS = [1, 2, 3, 4, 5];

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {STAR_POSITIONS.map((position) => (
        <Star
          className={
            position <= Math.round(rating)
              ? "text-gold"
              : "text-muted-foreground/25"
          }
          key={position}
          size={size}
          weight="fill"
        />
      ))}
    </span>
  );
}

/**
 * The quotes as a scroll-snapping rail. The arrows move it by one card, so on
 * a narrow screen the same markup is simply swiped instead.
 */
export function TestimonialRail({
  average,
  items,
}: {
  average: number;
  items: Testimonial[];
}) {
  const railRef = useRef<HTMLUListElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    // One card plus its gutter, measured live so the step survives a resize.
    const step = rail.firstElementChild?.clientWidth ?? rail.clientWidth / 3;
    rail.scrollBy({ behavior: "smooth", left: direction * (step + 20) });
  };

  return (
    <>
      <div className="reveal-soft flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
            Loved by thousands
          </p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.5rem]">
            What our customers say
          </h2>
          <div className="mt-4 flex items-center gap-2.5">
            <Stars rating={average} size={13} />
            <p className="text-2xs text-muted-foreground">
              {average.toFixed(1)} out of 5 across our published reviews
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Previous reviews"
            className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => scrollByCard(-1)}
            type="button"
          >
            <ArrowLeft size={14} weight="bold" />
          </button>
          <button
            aria-label="More reviews"
            className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => scrollByCard(1)}
            type="button"
          >
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <ul
        className="-mx-6 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={railRef}
      >
        {items.map((item) => (
          <li
            className="flex w-[min(22rem,85vw)] shrink-0 snap-start items-stretch gap-4 rounded-2xl border border-border/70 bg-card p-4 lg:w-[calc((100%-2.5rem)/3)]"
            key={item.id}
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted/30">
              {item.image && (
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={item.image}
                />
              )}
            </div>

            <div className="flex min-w-0 flex-col">
              <p className="text-xs leading-relaxed text-foreground">
                “{item.quote}”
              </p>
              <div className="mt-auto pt-3">
                <Stars rating={item.rating} />
                <p className="mt-1.5 text-2xs font-semibold text-muted-foreground">
                  {item.author}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
