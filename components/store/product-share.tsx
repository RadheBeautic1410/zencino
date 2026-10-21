"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  CheckIcon,
  FacebookLogoIcon,
  LinkSimpleIcon,
  TelegramLogoIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

// UTM tags let the campaign tracker and Google Analytics attribute visits to the share channel.
function shareUrl(slug: string, source: string) {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: "social_share",
    utm_campaign: "product_share",
  });
  return `${window.location.origin}/products/${slug}?${params}`;
}

const CHANNELS: Array<{
  label: string;
  source: string;
  icon: Icon;
  href: (url: string, text: string) => string;
}> = [
  {
    label: "WhatsApp",
    source: "whatsapp",
    icon: WhatsappLogoIcon,
    href: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    label: "Telegram",
    source: "telegram",
    icon: TelegramLogoIcon,
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    label: "Facebook",
    source: "facebook",
    icon: FacebookLogoIcon,
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

export function ProductShare({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const text = price
    ? `${name} – only ₹${price.toLocaleString("en-IN")} on Zencino`
    : `${name} on Zencino`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(slug, "copy_link"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); nothing to recover.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-ui text-foreground">
        Share:
      </span>
      {CHANNELS.map(({ label, source, icon: ChannelIcon, href }) => (
        <button
          aria-label={`Share on ${label}`}
          className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          key={source}
          onClick={() =>
            window.open(
              href(shareUrl(slug, source), text),
              "_blank",
              "noopener,noreferrer"
            )
          }
          type="button"
        >
          <ChannelIcon size={18} weight="bold" />
        </button>
      ))}
      <button
        aria-label="Copy product link"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        onClick={copyLink}
        type="button"
      >
        {copied ? (
          <CheckIcon size={16} weight="bold" />
        ) : (
          <LinkSimpleIcon size={16} weight="bold" />
        )}
        <span>{copied ? "Copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
