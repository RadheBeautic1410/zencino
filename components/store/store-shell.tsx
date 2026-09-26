"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowsClockwise,
  Bag,
  CaretDown,
  Diamond,
  FacebookLogo,
  Globe,
  InstagramLogo,
  List,
  MagnifyingGlass,
  PinterestLogo,
  ShieldCheck,
  Truck,
  User,
  X,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CampaignTracker } from "@/components/store/campaign-tracker";
import { NewsletterSignup } from "@/components/store/newsletter-signup";
import { WaveEdge } from "@/components/store/wave-edge";
import { SELLER_INFO, SOCIAL_LINKS } from "@/config/platform";

/** Shop destinations, shared by the desktop menu and the mobile drawer. */
const SHOP_LINKS = [
  {
    hint: "The complete Zencino catalog",
    href: "/products",
    label: "All Products",
  },
  {
    hint: "Drawer, desk and wardrobe order",
    href: "/categories/storage-organization",
    label: "Storage & Organization",
  },
  {
    hint: "Everyday pieces that earn their place",
    href: "/categories/home-kitchen",
    label: "Home & Kitchen",
  },
  {
    hint: "The signature diamond-polished line",
    href: "/collections/acrylic-essentials",
    label: "Acrylic Essentials",
  },
];

/** Session flag so a dismissed announcement stays dismissed. */
const NOTICE_KEY = "zencino:notice-dismissed";

/** Footer trust strip — the metric leads, the sentence qualifies it. */
const TRUST_POINTS = [
  {
    body: "Diamond-polished edges on shatter-resistant cast acrylic.",
    icon: Diamond,
    metric: "99%",
    title: "Optical clarity",
  },
  {
    body: "Complimentary pan-India delivery on every order above ₹999.",
    icon: Truck,
    metric: "₹0",
    title: "Shipping over ₹999",
  },
  {
    body: "Transit damage is replaced immediately, with no restocking fee.",
    icon: ArrowsClockwise,
    metric: "7 days",
    title: "Hassle-free returns",
  },
  {
    body: "UPI, cards and net banking, plus the verified Amazon channel.",
    icon: ShieldCheck,
    metric: "100%",
    title: "Secure checkout",
  },
];

/** The two navigational footer columns, between brand and newsletter. */
const FOOTER_COLUMNS = [
  {
    title: "Explore Catalog",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/categories/storage-organization", label: "Storage" },
      { href: "/categories/home-kitchen", label: "Home & Kitchen" },
      { href: "/collections/acrylic-essentials", label: "Acrylic Essentials" },
    ],
  },
  {
    title: "Support & Care",
    links: [
      { href: "/about", label: "About Zencino" },
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
      { href: "/track-order", label: "Track Your Order" },
      { href: "/account", label: "Customer Account" },
    ],
  },
] as const;

/** Policies run along the base bar rather than taking a column of their own. */
const LEGAL_LINKS = [
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns & Refunds" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms of Service" },
] as const;

const PAYMENT_METHODS = ["UPI / QR", "RuPay", "Visa / MC", "NetBanking"];

/** Keyed by the label in `SOCIAL_LINKS`, so config drives what renders. */
const SOCIAL_ICONS: Record<string, Icon> = {
  Facebook: FacebookLogo,
  Instagram: InstagramLogo,
  Pinterest: PinterestLogo,
  X: XLogo,
  YouTube: YoutubeLogo,
};

/** Starting points in the search panel — plain terms, not promises. */
const SEARCH_SUGGESTIONS = [
  "Desk organizer",
  "Drawer trays",
  "Knife holder",
  "Bathroom caddy",
  "Makeup storage",
];

export function StoreShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Server renders the Windows label; the effect corrects it on Apple devices.
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Escape closes whichever layer is open; Ctrl/Cmd+K jumps to search.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setShopOpen(false);
        setMobileMenuOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)) {
      setShortcutLabel("⌘ K");
    }
  }, []);

  // Every page mounts its own shell, so the dismissal has to outlive it.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(NOTICE_KEY) === "1") {
        setNoticeOpen(false);
      }
    } catch {
      // Private mode or blocked storage: the notice simply stays.
    }
  }, []);

  const dismissNotice = () => {
    setNoticeOpen(false);
    try {
      sessionStorage.setItem(NOTICE_KEY, "1");
    } catch {
      // Nothing to persist to; the notice returns on the next page.
    }
  };

  // The panel is worthless without focus landing in the field.
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const closeAll = () => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
  };

  const runSearch = (term: string) => {
    const query = term.trim();
    if (!query) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
    closeAll();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-page text-foreground flex flex-col">
      <CampaignTracker />
      <a
        className="sr-only focus:not-sr-only focus:block focus:p-4 bg-primary text-primary-foreground font-semibold"
        href="#main-content"
      >
        Skip to content
      </a>

      {/* Announcement Bar */}
      {noticeOpen && (
        <div className="relative bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-12 py-2 text-center text-2xs font-medium tracking-wide sm:text-xs">
            <span className="inline-flex size-1.5 shrink-0 animate-pulse rounded-full bg-gold" />
            <span>Complimentary pan-India delivery on orders above ₹999</span>
            <span className="hidden text-primary-foreground/40 md:inline">
              ·
            </span>
            <span className="hidden font-semibold text-primary-foreground/90 md:inline">
              Direct website & Amazon Prime channels
            </span>
          </div>
          <button
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={dismissNotice}
            type="button"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="header-settle sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        {/* Reading progress — scroll-linked in CSS, inert where unsupported */}
        <span
          aria-hidden
          className="scroll-progress absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-primary via-gold to-primary"
        />

        <div className="header-tighten mx-auto flex max-w-7xl items-center gap-3 px-6 py-3.5">
          {/* Mobile menu trigger */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="-ml-1.5 rounded-full p-2 text-foreground transition-colors hover:bg-muted/70 lg:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setSearchOpen(false);
            }}
            type="button"
          >
            {mobileMenuOpen ? (
              <X size={20} weight="bold" />
            ) : (
              <List size={20} weight="bold" />
            )}
          </button>

          {/* Wordmark */}
          <Link className="group flex shrink-0 items-center gap-2.5" href="/">
            <span className="relative grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform duration-500 group-hover:scale-105">
              <span className="display text-base leading-none">Z</span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl ring-1 ring-gold/0 ring-offset-0 ring-offset-background transition-all duration-500 group-hover:ring-gold/60 group-hover:ring-offset-2"
              />
            </span>
            <span className="display text-[1.35rem] text-foreground">
              zencino<span className="text-gold">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="ml-3 hidden items-center gap-0.5 lg:flex"
          >
            {/* Pointer opens it through CSS, click and Escape through state,
                so the panel needs no handlers on a non-interactive wrapper. */}
            <div className="group/shop relative">
              <button
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-foreground/75 transition-colors hover:bg-muted/70 hover:text-foreground group-hover/shop:bg-muted/70 group-hover/shop:text-foreground"
                onClick={() => setShopOpen(!shopOpen)}
                type="button"
              >
                Shop
                <CaretDown
                  className={`transition-transform duration-300 group-hover/shop:rotate-180 ${
                    shopOpen ? "rotate-180" : ""
                  }`}
                  size={11}
                  weight="bold"
                />
              </button>

              <div
                className={`absolute left-0 top-full w-[26rem] pt-3 transition-all duration-250 group-focus-within/shop:visible group-focus-within/shop:translate-y-0 group-focus-within/shop:opacity-100 group-hover/shop:visible group-hover/shop:translate-y-0 group-hover/shop:opacity-100 ${
                  shopOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent"
                  />
                  {SHOP_LINKS.map((link) => (
                    <Link
                      className="group/item flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-primary-wash"
                      href={link.href}
                      key={link.href}
                      onClick={closeAll}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-foreground transition-colors group-hover/item:text-primary">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block text-2xs text-muted-foreground">
                          {link.hint}
                        </span>
                      </span>
                      <ArrowRight
                        className="shrink-0 text-primary opacity-0 transition-all duration-300 group-hover/item:translate-x-0.5 group-hover/item:opacity-100"
                        size={14}
                        weight="bold"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-foreground/75 transition-colors hover:bg-muted/70 hover:text-foreground"
              href="/collections/acrylic-essentials"
            >
              Acrylic Essentials
              <span className="size-1.5 animate-pulse rounded-full bg-gold" />
            </Link>

            <Link
              className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-foreground/75 transition-colors hover:bg-muted/70 hover:text-foreground"
              href="/about"
            >
              Our Story
            </Link>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Looks like a field, opens the roomier panel below */}
            <button
              aria-expanded={searchOpen}
              aria-label="Search products"
              className="hidden items-center gap-2.5 rounded-full border border-border/70 bg-muted/40 py-1.5 pl-3.5 pr-1.5 text-xs text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-muted/70 md:flex"
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <MagnifyingGlass size={14} weight="bold" />
              <span className="pr-6">Search organizers</span>
              <kbd className="rounded-full border border-border/70 bg-background px-2 py-1 font-sans text-3xs font-semibold tracking-ui text-muted-foreground/80">
                {shortcutLabel}
              </kbd>
            </button>
            <button
              aria-label="Search products"
              className="rounded-full p-2 text-foreground/75 transition-colors hover:bg-muted/70 hover:text-primary md:hidden"
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </button>

            <Link
              aria-label="Track your order"
              className="hidden rounded-full p-2 text-foreground/75 transition-colors hover:bg-muted/70 hover:text-primary sm:inline-flex"
              href="/track-order"
              title="Track order"
            >
              <Truck size={18} weight="bold" />
            </Link>

            <Link
              aria-label="Customer account"
              className="rounded-full p-2 text-foreground/75 transition-colors hover:bg-muted/70 hover:text-primary"
              href="/account"
              title="Customer account"
            >
              <User size={18} weight="bold" />
            </Link>

            <Link
              className="group sheen ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-2xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              href="/cart"
              title="Shopping bag"
            >
              <Bag size={14} weight="bold" />
              <span className="hidden sm:inline">Bag</span>
            </Link>
          </div>
        </div>

        {/* Search Panel */}
        {searchOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 border-t border-border/60 bg-background/95 backdrop-blur-xl duration-300">
            <div className="mx-auto max-w-3xl px-6 py-8">
              <form className="relative" onSubmit={handleSearch}>
                <MagnifyingGlass
                  className="-translate-y-1/2 absolute left-5 top-1/2 text-primary-soft"
                  size={18}
                  weight="bold"
                />
                <input
                  className="w-full rounded-full border border-border/80 bg-muted/30 py-4 pl-13 pr-28 text-sm text-foreground transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search acrylic organizers, trays, holders…"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                />
                <button
                  className="-translate-y-1/2 absolute right-2 top-1/2 rounded-full bg-primary px-5 py-2.5 text-2xs font-bold uppercase tracking-ui text-primary-foreground transition-colors hover:bg-primary/90"
                  type="submit"
                >
                  Search
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
                  Popular
                </span>
                {SEARCH_SUGGESTIONS.map((term) => (
                  <button
                    className="rounded-full border border-border/70 px-3.5 py-1.5 text-xs text-foreground/80 transition-all duration-300 hover:border-gold/50 hover:bg-gold-subtle hover:text-gold-foreground"
                    key={term}
                    onClick={() => runSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-border/60 bg-background/97 px-6 py-6 backdrop-blur-xl duration-300 lg:hidden">
            <p className="text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
              Shop
            </p>
            <nav aria-label="Mobile navigation" className="mt-3 space-y-1">
              {SHOP_LINKS.map((link) => (
                <Link
                  className="group flex items-center justify-between gap-4 rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-border/70 hover:bg-primary-wash"
                  href={link.href}
                  key={link.href}
                  onClick={closeAll}
                >
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-2xs text-muted-foreground">
                      {link.hint}
                    </span>
                  </span>
                  <ArrowRight
                    className="shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1"
                    size={14}
                    weight="bold"
                  />
                </Link>
              ))}
            </nav>

            <p className="mt-7 text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
              Your account
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-ui text-primary-foreground"
                href="/cart"
                onClick={closeAll}
              >
                <Bag size={15} weight="bold" />
                Bag
              </Link>
              <Link
                className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-3 text-xs font-bold uppercase tracking-ui text-foreground/80 transition-colors hover:bg-muted/60"
                href="/account"
                onClick={closeAll}
              >
                <User size={15} weight="bold" />
                Account
              </Link>
              <Link
                className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-3 text-xs font-bold uppercase tracking-ui text-foreground/80 transition-colors hover:bg-muted/60"
                href="/track-order"
                onClick={closeAll}
              >
                <Truck size={15} weight="bold" />
                Track
              </Link>
              <Link
                className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-3 text-xs font-bold uppercase tracking-ui text-foreground/80 transition-colors hover:bg-muted/60"
                href="/about"
                onClick={closeAll}
              >
                Our Story
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1" id="main-content">
        {children}
      </main>

      {/* Storefront Footer — two brand tones, each entered on a wave */}
      <footer className="relative text-footer-top">
        <WaveEdge side="top" />

        <div className="grain relative overflow-hidden text-primary-foreground">
          {/* Trust strip — four claims as a set, each led by its number */}
          <div className="bg-footer-top">
            <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-12">
              <div className="mb-8 flex items-center gap-4">
                <p className="shrink-0 text-xs font-bold uppercase tracking-eyebrow text-gold">
                  Why Zencino
                </p>
                <span aria-hidden className="rule-gold h-px flex-1" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST_POINTS.map((point) => (
                  <div
                    className="group rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-6 backdrop-blur-xs transition-colors duration-500 hover:border-gold/40 hover:bg-primary-foreground/[0.1]"
                    key={point.title}
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-gold transition-transform duration-500 group-hover:-translate-y-0.5">
                      <point.icon size={18} weight="light" />
                    </span>
                    <p className="display mt-5 text-[1.75rem] text-primary-foreground">
                      {point.metric}
                    </p>
                    <p className="mt-1.5 text-2xs font-bold uppercase tracking-ui text-gold">
                      {point.title}
                    </p>
                    <p className="mt-2.5 text-xs leading-relaxed text-primary-foreground/65">
                      {point.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The deeper band breaking into the lighter one, same curve as the
              cap above — transparent above the wave, so the strip shows through. */}
          <WaveEdge className="bg-footer-top text-primary" side="top" />

          <div className="relative bg-primary pb-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 top-0 size-[30rem] rounded-full bg-gold/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] rounded-full bg-primary-foreground/[0.06] blur-3xl"
            />

            <div className="relative mx-auto max-w-7xl px-6">
              <div className="grid gap-x-8 gap-y-12 pt-6 sm:grid-cols-2 lg:grid-cols-12">
                {/* Brand, region and the registered-entity detail */}
                <div className="space-y-5 lg:col-span-4">
                  <Link className="inline-flex items-center gap-2.5" href="/">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground text-base font-black text-primary">
                      Z
                    </span>
                    <span className="font-heading text-2xl font-extrabold tracking-tight text-primary-foreground">
                      zencino<span className="text-gold">.</span>
                    </span>
                  </Link>

                  <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/70">
                    A little order. A lot of possibility. Thoughtfully
                    engineered crystal-clear acrylic organizers and home
                    essentials designed for serene, clutter-free spaces.
                  </p>

                  <div>
                    <p className="text-2xs font-bold uppercase tracking-ui text-primary-foreground/50">
                      Country / region
                    </p>
                    <span className="mt-2 inline-flex items-center gap-2 rounded-xl border border-primary-foreground/25 px-4 py-2.5 text-sm text-primary-foreground/85">
                      <Globe size={16} weight="light" />
                      India · INR ₹
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 text-2xs leading-relaxed text-primary-foreground/50">
                    <p className="font-semibold text-primary-foreground/70">
                      {SELLER_INFO.legalName}
                    </p>
                    <p>
                      GSTIN: {SELLER_INFO.gstin} · CIN: {SELLER_INFO.cin}
                    </p>
                    <p>
                      {SELLER_INFO.addressLine1}, {SELLER_INFO.addressLine2},{" "}
                      {SELLER_INFO.city}, {SELLER_INFO.state}{" "}
                      {SELLER_INFO.pincode}
                    </p>
                  </div>
                </div>

                {/* Link columns */}
                {FOOTER_COLUMNS.map((column) => (
                  <div className="lg:col-span-2" key={column.title}>
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-ui text-gold">
                      {column.title}
                    </h4>
                    <ul className="space-y-2.5 text-sm text-primary-foreground/70">
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            className="link-underline transition-colors hover:text-primary-foreground"
                            href={link.href}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Newsletter */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <h4 className="text-xs font-bold uppercase tracking-ui text-gold">
                    Join the list
                  </h4>
                  <p className="mb-5 mt-3 text-sm leading-relaxed text-primary-foreground/70">
                    One short note when a new piece joins the collection. No
                    noise, and you can leave whenever you like.
                  </p>
                  <NewsletterSignup />
                </div>
              </div>

              {/* Policies and the ways to pay */}
              <div className="mt-14 flex flex-col gap-5 border-t border-primary-foreground/15 pt-8 md:flex-row md:items-center md:justify-between">
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-primary-foreground/65">
                  {LEGAL_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="link-underline transition-colors hover:text-gold"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2 text-2xs font-semibold uppercase tracking-ui">
                  {PAYMENT_METHODS.map((method) => (
                    <span
                      className="rounded-md border border-primary-foreground/20 bg-primary-foreground/[0.07] px-2.5 py-1 text-primary-foreground/75"
                      key={method}
                    >
                      {method}
                    </span>
                  ))}
                  <span className="rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 font-bold text-gold">
                    Amazon Verified
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-5 border-t border-primary-foreground/10 pt-8 md:flex-row md:justify-between">
                <p className="text-xs text-primary-foreground/55">
                  © {new Date().getFullYear()} Zencino. All rights reserved.
                  Pan-India delivery.
                </p>

                <div className="flex items-center gap-4">
                  <span className="text-2xs font-bold uppercase tracking-ui text-primary-foreground/60">
                    Connect with us
                  </span>
                  <ul className="flex items-center gap-2">
                    {SOCIAL_LINKS.map((social) => {
                      const SocialIcon = SOCIAL_ICONS[social.label];
                      // A label added to config without a matching icon is
                      // skipped rather than crashing the whole footer.
                      if (!SocialIcon) {
                        return null;
                      }
                      return (
                        <li key={social.href}>
                          <a
                            className="inline-flex size-9 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                            href={social.href}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <span className="sr-only">{social.label}</span>
                            <SocialIcon size={16} weight="fill" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
