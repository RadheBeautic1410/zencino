"use client";

import {
  ArrowLeft,
  ArrowUUpLeft,
  Article,
  ChartBar,
  Envelope,
  FolderSimple,
  Gear,
  Headset,
  Megaphone,
  Package,
  Receipt,
  SignOut,
  SquaresFour,
  Stack,
  Tray,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const commerceNavItems = [
  { href: "/admin", label: "Overview", icon: ChartBar, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  {
    href: "/admin/returns",
    label: "Returns",
    icon: ArrowUUpLeft,
    exact: false,
  },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/inventory", label: "Inventory", icon: Tray, exact: false },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderSimple,
    exact: false,
  },
  {
    href: "/admin/collections",
    label: "Collections",
    icon: SquaresFour,
    exact: false,
  },
];

const operationsNavItems = [
  { href: "/admin/content", label: "Content", icon: Article, exact: false },
  { href: "/admin/support", label: "Support", icon: Headset, exact: false },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    exact: false,
  },
];

const systemNavItems = [
  { href: "/admin/settings", label: "Settings", icon: Gear, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/queues", label: "Queues", icon: Stack, exact: false },
  { href: "/admin/email", label: "Email", icon: Envelope, exact: false },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const renderNavGroup = (items: typeof commerceNavItems) => (
    <div className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-ui transition-all duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            href={href}
            key={href}
          >
            <Icon size={16} weight={isActive ? "fill" : "bold"} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:h-screen md:w-64">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary font-black text-primary-foreground text-sm shadow-xs">
          Z
        </span>
        <div className="min-w-0">
          <p className="font-heading font-black text-sm leading-none tracking-tight">
            zencino<span className="text-emerald-600">.</span>
          </p>
          <p className="mt-1 text-3xs font-bold uppercase tracking-ui text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
            Admin Console
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <p className="mb-2 px-3 text-3xs font-bold uppercase tracking-widest text-sidebar-foreground/40">
            Commerce
          </p>
          {renderNavGroup(commerceNavItems)}
        </div>

        <div>
          <p className="mb-2 px-3 text-3xs font-bold uppercase tracking-widest text-sidebar-foreground/40">
            Operations & Growth
          </p>
          {renderNavGroup(operationsNavItems)}
        </div>

        <div>
          <p className="mb-2 px-3 text-3xs font-bold uppercase tracking-widest text-sidebar-foreground/40">
            System
          </p>
          {renderNavGroup(systemNavItems)}
        </div>
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-sidebar-border p-4 bg-muted/20">
        <p className="truncate px-1 text-3xs font-semibold uppercase tracking-ui text-sidebar-foreground/50">
          {email}
        </p>
        <Button
          asChild
          className="w-full justify-start gap-2 rounded-xl text-xs"
          size="sm"
          variant="outline"
        >
          <Link href="/">
            <ArrowLeft size={14} />
            Storefront
          </Link>
        </Button>
        <form action={logoutAction}>
          <Button
            className="w-full justify-start gap-2 rounded-xl text-xs"
            size="sm"
            type="submit"
            variant="outline"
          >
            <SignOut size={14} />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
