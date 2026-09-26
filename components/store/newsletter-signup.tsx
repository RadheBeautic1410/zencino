"use client";

import { CheckCircle, Envelope, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { subscribeToNewsletterAction } from "@/app/actions/newsletter";

/**
 * Footer newsletter signup. Rendered on the brand band, so every colour here
 * is expressed against `primary-foreground` rather than the page palette.
 */
export function NewsletterSignup() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await subscribeToNewsletterAction(
      new FormData(event.currentTarget)
    );
    setLoading(false);

    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || "Could not complete the signup.");
    }
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-primary-foreground/[0.07] p-6">
        <CheckCircle
          className="mt-0.5 shrink-0 text-gold"
          size={20}
          weight="fill"
        />
        <p className="text-sm leading-relaxed text-primary-foreground/85">
          You are on the list. Watch your inbox for a short welcome note.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-name">
        Full name
      </label>
      <input
        autoComplete="name"
        className="h-12 w-full rounded-xl border border-primary-foreground/25 bg-transparent px-4 text-sm text-primary-foreground outline-none transition-colors placeholder:text-primary-foreground/50 focus-visible:border-gold/70"
        id="newsletter-name"
        name="name"
        placeholder="Full name"
        required
        type="text"
      />

      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        autoComplete="email"
        className="h-12 w-full rounded-xl border border-primary-foreground/25 bg-transparent px-4 text-sm text-primary-foreground outline-none transition-colors placeholder:text-primary-foreground/50 focus-visible:border-gold/70"
        id="newsletter-email"
        name="email"
        placeholder="Email"
        required
        type="email"
      />

      <label
        className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-primary-foreground/80"
        htmlFor="newsletter-consent"
      >
        <input
          className="size-4 shrink-0 accent-gold"
          id="newsletter-consent"
          name="consent"
          type="checkbox"
        />
        Subscribe to email marketing
      </label>

      {error && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-gold">
          <WarningCircle className="mt-px shrink-0" size={14} weight="fill" />
          {error}
        </p>
      )}

      <button
        className="sheen inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-primary-foreground text-xs font-bold uppercase tracking-ui text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-gold-foreground disabled:pointer-events-none disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        <Envelope size={16} weight="light" />
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
