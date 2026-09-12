import Link from "next/link";
import type { ReactNode } from "react";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:block focus:p-4"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5"
        >
          <Link className="text-2xl font-bold tracking-tight" href="/">
            zencino<span className="text-success">.</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <a href="/#collections">Explore</a>
            <Link href="/account">My account</Link>
          </div>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Zencino</p>
          <p>Home, kitchen & everyday discoveries.</p>
          <Link href="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
