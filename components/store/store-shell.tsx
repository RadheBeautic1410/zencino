"use client";

import {
  ArrowRight,
  ArrowsClockwise,
  Bag,
  CaretDown,
  Diamond,
  List,
  MagnifyingGlass,
  ShieldCheck,
  Truck,
  User,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CampaignTracker } from "@/components/store/campaign-tracker";
import { SELLER_INFO } from "@/config/platform";

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

      {/* Storefront Footer */}
      <footer className="border-t border-border/70 bg-card text-card-foreground">
        {/* Trust strip — four claims as a set, each led by its number */}
        <div className="border-b border-border/60 bg-linear-to-b from-secondary/50 to-card">
          <div className="mx-auto max-w-7xl px-6 pt-16 pb-14">
            <div className="mb-8 flex items-center gap-4">
              <p className="eyebrow shrink-0">Why Zencino</p>
              <span aria-hidden className="rule-gold h-px flex-1" />
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_POINTS.map((point) => (
                <div
                  className="group relative bg-card p-7 transition-colors duration-500 hover:bg-primary-wash/40"
                  key={point.title}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-wash text-primary-soft transition-all duration-500 group-hover:-translate-y-0.5 group-hover:bg-gold-subtle group-hover:text-gold-foreground">
                    <point.icon size={18} weight="light" />
                  </span>
                  <p className="display mt-5 text-[1.75rem] text-foreground">
                    {point.metric}
                  </p>
                  <p className="mt-1.5 text-2xs font-bold uppercase tracking-ui text-primary-soft">
                    {point.title}
                  </p>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {point.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Column 1 & 2: Brand */}
            <div className="space-y-4 lg:col-span-2">
              <Link className="group inline-flex items-center gap-2.5" href="/">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-sm">
                  Z
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                  zencino<span className="text-gold">.</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                A little order. A lot of possibility. Thoughtfully engineered
                crystal-clear acrylic organizers and home essentials designed
                for serene, clutter-free spaces.
              </p>
              <div className="space-y-1 pt-2 text-2xs text-muted-foreground/80">
                <p>
                  <span className="font-semibold text-foreground">
                    {SELLER_INFO.legalName}
                  </span>
                </p>
                <p>
                  GSTIN: {SELLER_INFO.gstin} · CIN: {SELLER_INFO.cin}
                </p>
                <p>
                  Registered Office: {SELLER_INFO.addressLine1},{" "}
                  {SELLER_INFO.addressLine2}, {SELLER_INFO.city},{" "}
                  {SELLER_INFO.state} {SELLER_INFO.pincode}
                </p>
              </div>
            </div>

            {/* Column 3: Shop */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Explore Catalog
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/products"
                  >
                    All Products
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/categories/storage-organization"
                  >
                    Storage & Organization
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/categories/home-kitchen"
                  >
                    Home & Kitchen
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/collections/acrylic-essentials"
                  >
                    Acrylic Essentials
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Customer Care */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Support & Care
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/about"
                  >
                    About Zencino
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/contact"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/faq"
                  >
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/track-order"
                  >
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/account"
                  >
                    Customer Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Legal & Trust
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/policies/shipping"
                  >
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/policies/returns"
                  >
                    Returns & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/policies/privacy"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    href="/policies/terms"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 border-t border-border/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Zencino. All rights reserved.
              Pan-India Delivery.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-2xs uppercase tracking-ui font-semibold text-muted-foreground">
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
                UPI / QR
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
                RuPay
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
                Visa / MC
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
                NetBanking
              </span>
              <span className="rounded-md border border-gold/30 bg-gold-subtle px-2.5 py-1 font-bold text-gold-foreground">
                Amazon Verified
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
