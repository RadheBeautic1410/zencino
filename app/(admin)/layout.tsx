import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-page md:h-screen md:flex-row md:overflow-hidden">
      <AdminSidebar email={session.user.email} />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
