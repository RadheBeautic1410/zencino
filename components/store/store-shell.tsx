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
      <a
        className="sr-only focus:not-sr-only focus:block focus:p-4 bg-primary text-primary-foreground font-semibold"
        href="#main-content"
      >
        Skip to content
      </a>

      {/* Announcement Bar */}
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground tracking-wide">
        <span>Curated Home & Acrylic Essentials · Direct Website & Amazon Purchase Available</span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-foreground p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>

            <Link className="text-2xl font-black tracking-tight" href="/">
              zencino<span className="text-success">.</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-ui">
            <Link href="/products" className="text-foreground/80 hover:text-foreground transition-colors">
              All Products
            </Link>
            <Link href="/categories/storage-organization" className="text-foreground/80 hover:text-foreground transition-colors">
              Storage & Organization
            </Link>
            <Link href="/categories/home-kitchen" className="text-foreground/80 hover:text-foreground transition-colors">
              Home & Kitchen
            </Link>
            <Link href="/collections/acrylic-essentials" className="text-foreground/80 hover:text-foreground transition-colors">
              Acrylic Essentials
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block w-56">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-muted/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <MagnifyingGlass className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
            </form>

            {/* Account Link */}
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-ui text-foreground/80 hover:text-foreground"
              title="Customer Account"
            >
              <User size={18} />
              <span className="hidden sm:inline">Account</span>
            </Link>

            {/* Cart Indicator */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-ui hover:bg-muted transition-colors"
              title="Shopping Bag"
            >
              <Bag size={16} weight="bold" />
              <span className="text-xs">Bag</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background px-6 py-5 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products, acrylic organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-muted/60 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <MagnifyingGlass className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            </form>

            <nav className="flex flex-col space-y-3 pt-2 text-sm font-semibold uppercase tracking-ui">
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-border/50 flex items-center justify-between text-primary font-bold"
              >
                <span>Shopping Bag</span>
                <Bag size={18} weight="bold" />
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-border/50"
              >
                All Products
              </Link>
              <Link
                href="/categories/storage-organization"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-border/50"
              >
                Storage & Organization
              </Link>
              <Link
                href="/categories/home-kitchen"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-border/50"
              >
                Home & Kitchen
              </Link>
              <Link
                href="/collections/acrylic-essentials"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-border/50"
              >
                Acrylic Essentials
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-primary"
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
      <footer className="border-t border-border bg-card text-card-foreground mt-20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <Link className="text-2xl font-black tracking-tight" href="/">
                zencino<span className="text-success">.</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A little order. A lot of possibility. Thoughtfully curated acrylic organizers, home and kitchen essentials designed for everyday spaces.
              </p>
              <p className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                India · INR (₹)
              </p>
            </div>

            {/* Column 2: Shop */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Explore Catalog
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-foreground transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/categories/storage-organization" className="hover:text-foreground transition-colors">
                    Storage & Organization
                  </Link>
                </li>
                <li>
                  <Link href="/categories/home-kitchen" className="hover:text-foreground transition-colors">
                    Home & Kitchen
                  </Link>
                </li>
                <li>
                  <Link href="/collections/acrylic-essentials" className="hover:text-foreground transition-colors">
                    Acrylic Essentials
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Support & Info
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Zencino
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-foreground transition-colors">
                    Order Lookup & Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Policies */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-ui text-foreground mb-4">
                Policies
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/policies/shipping" className="hover:text-foreground transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/returns" className="hover:text-foreground transition-colors">
                    Returns & Cancellations
                  </Link>
                </li>
                <li>
                  <Link href="/policies/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Zencino. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Dual Purchasing: Zencino Store + Verified Amazon India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
