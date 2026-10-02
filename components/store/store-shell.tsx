"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  CaretDown,
  FacebookLogo,
  Heart,
  InstagramLogo,
  List,
  MagnifyingGlass,
  PinterestLogo,
  ShoppingCart,
  User,
  X,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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
    hint: "Everyday essentials for a smarter home",
    href: "/categories/home-kitchen",
    label: "Home & Kitchen",
  },
  {
    hint: "Keep a workspace clean and productive",
    href: "/categories/stationery-office",
    label: "Stationery & Office",
  },
  {
    hint: "Drawer, desk and wardrobe order",
    href: "/categories/storage-organization",
    label: "Storage & Organization",
  },
];

/** The published lines. One entry today; the menu grows with the catalog. */
const COLLECTION_LINKS = [
  {
    hint: "The signature diamond-polished line",
    href: "/collections/acrylic-essentials",
    label: "Acrylic Essentials",
  },
  {
    hint: "Everything currently in stock",
    href: "/products",
    label: "Browse everything",
  },
];

/** Flat links sitting to the right of the two menus. */
const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/#process", label: "Our Process" },
  { href: "/faq", label: "FAQs" },
];

/** Session flag so a dismissed announcement stays dismissed. */
const NOTICE_KEY = "zencino:notice-dismissed";

/** The three navigational footer columns, between brand and newsletter. */
const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/categories/home-kitchen", label: "Home & Kitchen" },
      { href: "/categories/stationery-office", label: "Stationery & Office" },
      {
        href: "/categories/storage-organization",
        label: "Storage & Organization",
      },
      { href: "/collections/acrylic-essentials", label: "Acrylic Essentials" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/#process", label: "Our Process" },
      { href: "/faq", label: "FAQs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { href: "/policies/shipping", label: "Shipping Policy" },
      { href: "/policies/returns", label: "Return & Replacement" },
      { href: "/track-order", label: "Track Your Order" },
      { href: "/policies/terms", label: "Terms & Conditions" },
      { href: "/policies/privacy", label: "Privacy Policy" },
    ],
  },
] as const;

/** Keyed by the label in `SOCIAL_LINKS`, so config drives what renders. */
const SOCIAL_ICONS: Record<string, Icon> = {
  Facebook: FacebookLogo,
  Instagram: InstagramLogo,
  Pinterest: PinterestLogo,
  X: XLogo,
  YouTube: YoutubeLogo,
};

interface MenuLink {
  hint: string;
  href: string;
  label: string;
}

/** A hover-and-click nav menu. Pointer opens it in CSS, Escape closes it. */
function NavMenu({
  label,
  links,
  onNavigate,
}: {
  label: string;
  links: readonly MenuLink[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="group/menu relative">
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8125rem] text-foreground/75 transition-colors hover:text-foreground group-hover/menu:text-foreground"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {label}
        <CaretDown
          className={`transition-transform duration-300 group-hover/menu:rotate-180 ${
            open ? "rotate-180" : ""
          }`}
          size={10}
          weight="bold"
        />
      </button>

      <div
        className={`absolute left-0 top-full w-88 pt-3 transition-all duration-200 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/97 p-2 shadow-2xl backdrop-blur-xl">
          {links.map((link) => (
            <Link
              className="group/item flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-primary-wash"
              href={link.href}
              key={link.href}
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
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
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [chromeHeight, setChromeHeight] = useState<number | null>(null);

  // Escape closes whichever layer is open; Ctrl/Cmd+K jumps to the field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSearchOpen(false);
        setMobileMenuOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (desktopSearchRef.current?.offsetParent) {
          desktopSearchRef.current.focus();
        } else {
          setMobileSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

  // Published so a section can fill exactly the screen left below the chrome
  // (the hero does). Two states are skipped rather than measured: past the top
  // of the page the header is mid-tighten, and an open mobile panel sits inside
  // the header, so either reading would be of something taller than the chrome.
  useEffect(() => {
    const measure = () => {
      if (window.scrollY > 4 || mobileMenuOpen || mobileSearchOpen) {
        return;
      }
      const notice = noticeOpen ? (noticeRef.current?.offsetHeight ?? 0) : 0;
      setChromeHeight(notice + (headerRef.current?.offsetHeight ?? 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mobileMenuOpen, mobileSearchOpen, noticeOpen]);

  // The panel is worthless without focus landing in the field.
  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const dismissNotice = () => {
    setNoticeOpen(false);
    try {
      sessionStorage.setItem(NOTICE_KEY, "1");
    } catch {
      // Nothing to persist to; the notice returns on the next page.
    }
  };

  const closeAll = () => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
    closeAll();
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-page text-foreground"
      style={
        chromeHeight === null
          ? undefined
          : ({ "--chrome-h": `${chromeHeight}px` } as CSSProperties)
      }
    >
      <CampaignTracker />
      <a
        className="sr-only bg-primary font-semibold text-primary-foreground focus:not-sr-only focus:block focus:p-4"
        href="#main-content"
      >
        Skip to content
      </a>

      {noticeOpen && (
        <div
          className="relative bg-primary text-primary-foreground"
          ref={noticeRef}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-12 py-2 text-center text-2xs tracking-wide">
            <span className="inline-flex size-1.5 shrink-0 animate-pulse rounded-full bg-gold" />
            <span>Complimentary pan-India delivery on orders above ₹999</span>
          </div>
          <button
            aria-label="Dismiss announcement"
            className="-translate-y-1/2 absolute top-1/2 right-3 rounded-full p-1.5 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={dismissNotice}
            type="button"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
      )}

      <header
        className="header-settle sticky top-0 z-50 border-b border-border/50 bg-page/85 backdrop-blur-xl"
        ref={headerRef}
      >
        {/* Reading progress — scroll-linked in CSS, inert where unsupported */}
        <span
          aria-hidden
          className="scroll-progress absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-primary via-gold to-primary"
        />

        <div className="header-tighten mx-auto flex max-w-7xl items-center gap-3 px-6 py-3.5">
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="-ml-1.5 rounded-full p-2 text-foreground transition-colors hover:bg-muted/70 lg:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setMobileSearchOpen(false);
            }}
            type="button"
          >
            {mobileMenuOpen ? (
              <X size={20} weight="bold" />
            ) : (
              <List size={20} weight="bold" />
            )}
          </button>

          <Link className="shrink-0" href="/">
            <span className="display text-[1.4rem] text-foreground">
              Zencino
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="ml-6 hidden items-center gap-1 lg:flex"
          >
            <NavMenu label="Shop" links={SHOP_LINKS} onNavigate={closeAll} />
            <NavMenu
              label="Collections"
              links={COLLECTION_LINKS}
              onNavigate={closeAll}
            />
            {NAV_LINKS.map((link) => (
              <Link
                className="rounded-full px-3 py-2 text-[0.8125rem] text-foreground/75 transition-colors hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* A real field rather than a button that opens one — the header
                has the room, and it is the shop's main way in. */}
            <form className="relative hidden lg:block" onSubmit={handleSearch}>
              <MagnifyingGlass
                className="-translate-y-1/2 absolute top-1/2 left-4 text-muted-foreground"
                size={14}
              />
              <input
                aria-label="Search products"
                className="w-64 rounded-full border border-border/70 bg-background/70 py-2.5 pr-10 pl-10 text-xs text-foreground transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/8"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search for organizers…"
                ref={desktopSearchRef}
                type="search"
                value={searchQuery}
              />
              <button
                aria-label="Search"
                className="-translate-y-1/2 absolute top-1/2 right-1.5 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                type="submit"
              >
                <MagnifyingGlass size={13} weight="bold" />
              </button>
            </form>

            <button
              aria-label="Search products"
              className="rounded-full p-2 text-foreground/75 transition-colors hover:bg-muted/70 hover:text-primary lg:hidden"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </button>

            <Link
              aria-label="Customer account"
              className="rounded-full p-2 text-foreground/75 transition-colors hover:bg-muted/70 hover:text-primary"
              href="/account"
              title="Customer account"
            >
              <User size={18} />
            </Link>

            <Link
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              href="/cart"
              title="Shopping bag"
            >
              <ShoppingCart size={15} weight="bold" />
              <span className="hidden sm:inline">Bag</span>
            </Link>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 border-t border-border/60 bg-background/97 px-6 py-5 backdrop-blur-xl duration-300 lg:hidden">
            <form className="relative" onSubmit={handleSearch}>
              <MagnifyingGlass
                className="-translate-y-1/2 absolute top-1/2 left-4 text-primary-soft"
                size={16}
                weight="bold"
              />
              <input
                aria-label="Search products"
                className="w-full rounded-full border border-border/80 bg-muted/30 py-3.5 pr-24 pl-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:outline-none"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search for organizers…"
                ref={mobileSearchRef}
                type="search"
                value={searchQuery}
              />
              <button
                className="-translate-y-1/2 absolute top-1/2 right-2 rounded-full bg-primary px-4 py-2 text-2xs font-bold uppercase tracking-ui text-primary-foreground"
                type="submit"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-border/60 bg-background/97 px-6 py-6 backdrop-blur-xl duration-300 lg:hidden">
            {[
              { links: SHOP_LINKS, title: "Shop" },
              { links: COLLECTION_LINKS, title: "Collections" },
            ].map((group) => (
              <div className="mb-6" key={group.title}>
                <p className="text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
                  {group.title}
                </p>
                <nav aria-label={group.title} className="mt-3 space-y-1">
                  {group.links.map((link) => (
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
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  className="rounded-xl border border-border/70 px-4 py-3 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted/60"
                  href={link.href}
                  key={link.href}
                  onClick={closeAll}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                className="rounded-xl border border-border/70 px-4 py-3 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted/60"
                href="/track-order"
                onClick={closeAll}
              >
                Track order
              </Link>
              <Link
                className="rounded-xl border border-border/70 px-4 py-3 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted/60"
                href="/account"
                onClick={closeAll}
              >
                Account
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1" id="main-content">
        {children}
      </main>

      {/* The last page section hands off to the footer on the same curve the
          dark bands above use, rather than a ruled line. */}
      <WaveEdge className="text-primary" side="top" />

      {/* One deep evergreen band: brand, three link columns, the newsletter,
          and a base bar that carries the legal line. */}
      <footer className="grain relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 size-120 rounded-full bg-gold/8 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-8">
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <Link href="/">
                <span className="display text-2xl text-primary-foreground">
                  Zencino
                </span>
              </Link>

              <p className="max-w-xs text-xs leading-relaxed text-primary-foreground/65">
                Premium acrylic organizers designed to bring clarity, calm and
                beauty to your everyday spaces.
              </p>

              <ul className="flex items-center gap-2.5">
                {SOCIAL_LINKS.map((social) => {
                  const SocialIcon = SOCIAL_ICONS[social.label];
                  // A label added to config without a matching icon is skipped
                  // rather than crashing the whole footer.
                  if (!SocialIcon) {
                    return null;
                  }
                  return (
                    <li key={social.href}>
                      <a
                        className="inline-flex size-8 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                        href={social.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span className="sr-only">{social.label}</span>
                        <SocialIcon size={14} weight="fill" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div className="lg:col-span-2" key={column.title}>
                <h4 className="text-xs font-semibold text-primary-foreground">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-2.5 text-xs text-primary-foreground/65">
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

            <div className="sm:col-span-2 lg:col-span-2">
              <h4 className="text-xs font-semibold text-primary-foreground">
                Join our newsletter
              </h4>
              <p className="mt-4 mb-4 text-xs leading-relaxed text-primary-foreground/65">
                Get updates on new arrivals and exclusive offers.
              </p>
              <NewsletterSignup />
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 border-t border-primary-foreground/12 pt-7 md:flex-row md:justify-between">
            <p className="text-2xs text-primary-foreground/55">
              © {new Date().getFullYear()} Zencino. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 text-2xs text-primary-foreground/55">
              Made with
              <Heart className="text-gold" size={11} weight="fill" />
              in India
            </p>
          </div>

          <p className="mt-5 text-3xs leading-relaxed text-primary-foreground/35">
            {SELLER_INFO.legalName} · GSTIN {SELLER_INFO.gstin} ·{" "}
            {SELLER_INFO.addressLine1}, {SELLER_INFO.city}, {SELLER_INFO.state}{" "}
            {SELLER_INFO.pincode}
          </p>
        </div>
      </footer>
    </div>
  );
}
