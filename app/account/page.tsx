import Link from "next/link";
import { AppShell } from "@/components/scaffold/app-shell";
import { ADMIN_ROLE } from "@/config/platform";
import { requireSession } from "@/lib/authz";

export const metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const current = await requireSession();
  return (
    <AppShell
      email={current.user.email}
      isAdmin={current.user.role === ADMIN_ROLE}
    >
      <p className="mb-3 text-sm text-muted-foreground">My Zencino</p>
      <h1 className="text-3xl font-bold">
        Welcome, {current.user.name || "there"}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Manage your profile and sign-in sessions.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          className="border border-border bg-background p-6"
          href="/account/profile"
        >
          <h2 className="text-xl font-semibold">Profile & security</h2>
          <p className="mt-3 text-muted-foreground">
            Your account details and active sessions.
          </p>
        </Link>
        <Link className="border border-border bg-background p-6" href="/">
          <h2 className="text-xl font-semibold">Explore Zencino</h2>
          <p className="mt-3 text-muted-foreground">
            Visit our home and kitchen storefront.
          </p>
        </Link>
      </div>
    </AppShell>
  );
}
