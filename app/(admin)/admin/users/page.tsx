import { and, desc, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { UserBanForm, UserRoleForm } from "@/components/orbit/user-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLE } from "@/config/platform";
import { user } from "@/db/schema";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Users",
};

interface SearchParams {
  q?: string;
  role?: string;
  state?: string;
}

export default async function OrbitUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, role, state } = await searchParams;

  const conditions: SQL[] = [];
  const term = q?.trim();
  if (term) {
    const match = or(
      ilike(user.email, `%${term}%`),
      ilike(user.name, `%${term}%`)
    );
    if (match) {
      conditions.push(match);
    }
  }
  if (role === ADMIN_ROLE) {
    conditions.push(eq(user.role, ADMIN_ROLE));
  } else if (role === "user") {
    conditions.push(ne(user.role, ADMIN_ROLE));
  }
  if (state === "active" || state === "banned") {
    conditions.push(eq(user.banned, state === "banned"));
  }

  const users = await db
    .select()
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(user.createdAt));

  return (
    <div>
      <OrbitPageHeader
        description="Promote admins, disable accounts, and inspect basic account state."
        eyebrow="Admin"
        title="User Management"
      />

      <div className="mb-6">
        <AdminFilterBar
          searchPlaceholder="Search by email or name..."
          selects={[
            {
              label: "Role",
              param: "role",
              options: [
                { label: "Admin", value: ADMIN_ROLE },
                { label: "Customer", value: "user" },
              ],
            },
            {
              label: "Status",
              param: "state",
              options: [
                { label: "Active", value: "active" },
                { label: "Banned", value: "banned" },
              ],
            },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            All registered accounts ordered by sign-up date.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-muted-foreground text-xs"
                    colSpan={5}
                  >
                    No users match the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold">{item.email}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.role === ADMIN_ROLE ? "text-success" : undefined
                      }
                      variant={
                        item.role === ADMIN_ROLE ? "default" : "secondary"
                      }
                    >
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={item.banned ? undefined : "text-success"}
                      variant={item.banned ? "destructive" : "default"}
                    >
                      {item.banned ? "banned" : "active"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <UserRoleForm role={item.role} userId={item.id} />
                      <UserBanForm banned={item.banned} userId={item.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
