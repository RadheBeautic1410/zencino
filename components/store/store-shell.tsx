"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bag,
  List,
  MagnifyingGlass,
  User,
  X,
} from "@phosphor-icons/react";
import { CampaignTracker } from "@/components/store/campaign-tracker";

export function StoreShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
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
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground tracking-wide border-b border-primary/20 shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Complimentary Pan-India Delivery on orders above ₹999</span>
          <span className="hidden md:inline text-primary-foreground/50">·</span>
          <span className="hidden md:inline text-primary-foreground/90 font-semibold">Direct Website & Amazon Prime Channels</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>

            <Link className="flex items-center gap-2.5 group" href="/">
              <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                Z
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                zencino<span className="text-emerald-600">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-8 text-xs font-semibold uppercase tracking-ui">
            <Link href="/products" className="text-foreground/75 hover:text-primary transition-colors">
              All Products
            </Link>
            <Link href="/categories/storage-organization" className="text-foreground/75 hover:text-primary transition-colors">
              Storage & Organization
            </Link>
            <Link href="/categories/home-kitchen" className="text-foreground/75 hover:text-primary transition-colors">
              Home & Kitchen
            </Link>
            <Link href="/collections/acrylic-essentials" className="inline-flex items-center gap-1.5 text-foreground/75 hover:text-primary transition-colors">
              <span>Acrylic Essentials</span>
              <span className="size-1.5 rounded-full bg-amber-500" />
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-3.5">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block w-60">
              <input
                type="text"
                placeholder="Search acrylic organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/80 bg-muted/40 pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <MagnifyingGlass className="absolute left-3 top-2 text-muted-foreground" size={14} weight="bold" />
            </form>

            {/* Track Order */}
            <Link
              href="/track-order"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-ui text-foreground/75 hover:text-primary transition-colors px-2 py-1 rounded-md"
              title="Track Order"
            >
              <span>Track</span>
            </Link>

            {/* Account Link */}
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-ui text-foreground/75 hover:text-primary transition-colors px-2 py-1 rounded-md"
              title="Customer Account"
            >
              <User size={18} weight="bold" />
              <span className="hidden sm:inline">Account</span>
            </Link>

            {/* Cart Indicator */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-ui hover:bg-primary/90 shadow-xs transition-all hover:scale-102"
              title="Shopping Bag"
            >
              <Bag size={15} weight="bold" />
              <span>Bag</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/80 bg-background/95 backdrop-blur-md px-6 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search acrylic organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/80 bg-muted/40 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <MagnifyingGlass className="absolute left-3 top-2.5 text-muted-foreground" size={16} weight="bold" />
            </form>

            <nav className="flex flex-col space-y-1 pt-2 text-sm font-semibold uppercase tracking-ui">
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary flex items-center justify-between font-bold"
              >
                <span>Shopping Bag</span>
                <Bag size={18} weight="bold" />
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                All Products
              </Link>
              <Link
                href="/categories/storage-organization"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                Storage & Organization
              </Link>
              <Link
                href="/categories/home-kitchen"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                Home & Kitchen
              </Link>
              <Link
                href="/collections/acrylic-essentials"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-between"
              >
                <span>Acrylic Essentials</span>
                <span className="size-1.5 rounded-full bg-amber-500" />
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                Track Order
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-primary font-bold hover:bg-muted/50 transition-colors"
              >
                My Account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Storefront Footer */}
      <footer className="border-t border-border/80 bg-card text-card-foreground mt-24">
        {/* Trust Highlight Banner */}
        <div className="border-b border-border/60 bg-muted/30 py-8">
          <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                99%
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-ui text-foreground">Optical Acrylic</p>
                <p className="text-2xs text-muted-foreground">Diamond-polished & shatter-resistant</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                ₹0
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-ui text-foreground">Complimentary Shipping</p>
                <p className="text-2xs text-muted-foreground">All orders over ₹999 pan-India</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                7D
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-ui text-foreground">Hassle-Free Returns</p>
                <p className="text-2xs text-muted-foreground">Transit damage instant replacement</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                100%
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-ui text-foreground">Secure Checkout</p>
                <p className="text-2xs text-muted-foreground">UPI, Cards & Amazon Prime Option</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Column 1 & 2: Brand */}
            <div className="space-y-4 lg:col-span-2">
              <Link className="flex items-center gap-2.5 group inline-block" href="/">
                <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-sm">
                  Z
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                  zencino<span className="text-emerald-600">.</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                A little order. A lot of possibility. Thoughtfully engineered crystal-clear acrylic organizers and home essentials designed for serene, clutter-free spaces.
              </p>
              <div className="space-y-1 pt-2 text-2xs text-muted-foreground/80">
                <p><span className="font-semibold text-foreground">Zencino Retail India Private Limited</span></p>
                <p>GSTIN: 27AAACZ1234A1Z5 · CIN: U52100MH2025PTC998877</p>
                <p>Registered Office: Unit 402, Trade Link Hub, Mumbai, Maharashtra 400013</p>
              </div>
            </div>

            {/* Column 3: Shop */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Explore Catalog
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-primary transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/categories/storage-organization" className="hover:text-primary transition-colors">
                    Storage & Organization
                  </Link>
                </li>
                <li>
                  <Link href="/categories/home-kitchen" className="hover:text-primary transition-colors">
                    Home & Kitchen
                  </Link>
                </li>
                <li>
                  <Link href="/collections/acrylic-essentials" className="hover:text-primary transition-colors">
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
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About Zencino
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-primary transition-colors">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-primary transition-colors">
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
                  <Link href="/policies/shipping" className="hover:text-primary transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/returns" className="hover:text-primary transition-colors">
                    Returns & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 border-t border-border/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Zencino. All rights reserved. Pan-India Delivery.</p>
            <div className="flex flex-wrap items-center gap-3 text-2xs uppercase tracking-ui font-semibold text-muted-foreground">
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">UPI / QR</span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">RuPay</span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">Visa / MC</span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">NetBanking</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold">Amazon Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
