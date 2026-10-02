import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Small caps label above the title. */
  eyebrow: string;
  /** Optional sentence under the title. */
  lead?: ReactNode;
  /** Optional trailing link, set to the right of the title on wide screens. */
  linkHref?: string;
  linkLabel?: string;
  title: ReactNode;
  /**
   * Which ground the heading sits on. `dark` is for the full-bleed evergreen
   * bands, where the page's text scale would disappear into the fill.
   */
  tone?: "dark" | "light";
}

/** The text scale per ground, so the two readings stay in one place. */
const TONES = {
  light: {
    eyebrow: "text-primary-soft",
    lead: "text-muted-foreground",
    link: "text-foreground hover:text-primary",
    title: "text-foreground",
  },
  dark: {
    eyebrow: "text-gold",
    lead: "text-primary-foreground/75",
    link: "text-primary-foreground hover:text-gold",
    title: "text-primary-foreground",
  },
} as const;

/**
 * The homepage's repeating section opener: eyebrow, serif title, and an
 * optional "view all" on the far right. One definition keeps the rhythm
 * identical down the page.
 */
export function SectionHeading({
  eyebrow,
  lead,
  linkHref,
  linkLabel,
  title,
  tone = "light",
}: SectionHeadingProps) {
  const palette = TONES[tone];

  return (
    <div className="reveal-soft flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p
          className={`text-2xs font-bold uppercase tracking-eyebrow ${palette.eyebrow}`}
        >
          {eyebrow}
        </p>
        <h2
          className={`display mt-3 text-3xl md:text-[2.5rem] ${palette.title}`}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={`mt-4 max-w-md text-sm leading-relaxed ${palette.lead}`}
          >
            {lead}
          </p>
        )}
      </div>

      {linkHref && linkLabel && (
        <Link
          className={`group link-underline inline-flex shrink-0 items-center gap-2 text-xs font-semibold transition-colors ${palette.link}`}
          href={linkHref}
        >
          {linkLabel}
          <ArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1"
            size={12}
            weight="bold"
          />
        </Link>
      )}
    </div>
  );
}
