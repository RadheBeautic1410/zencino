import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
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
import { getQueueSummary } from "@/lib/worker/queue-inspection";

export const metadata = {
  title: "Queues",
};

interface SearchParams {
  q?: string;
  state?: string;
}

export default async function OrbitQueuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, state } = await searchParams;
  const allQueues = await getQueueSummary();
  const term = q?.trim().toLowerCase();
  const queues = allQueues.filter(
    (queue) =>
      (!term || queue.name.toLowerCase().includes(term)) &&
      (!state || queue.state === state)
  );
  const stateOptions = [...new Set(allQueues.map((queue) => queue.state))]
    .sort()
    .map((value) => ({ label: value, value }));

  return (
    <div>
      <OrbitPageHeader
        description="pg-boss queue state grouped by queue name and state. Start the worker to create the pgboss schema."
        eyebrow="Admin"
        title="Queues"
      />

      <div className="mb-6">
        <AdminFilterBar
          searchPlaceholder="Search queue name..."
          selects={[{ label: "State", param: "state", options: stateOptions }]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>pg-boss</CardTitle>
          <CardDescription>
            Job queue states grouped by queue name. Run the worker to populate.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allQueues.length > 0 && queues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    No queues match the selected filters.
                  </TableCell>
                </TableRow>
              ) : queues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    No pg-boss rows yet. Run <code>pnpm worker</code> or enqueue
                    an email.
                  </TableCell>
                </TableRow>
              ) : (
                queues.map((queue) => (
                  <TableRow key={`${queue.name}:${queue.state}`}>
                    <TableCell>{queue.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          queue.state === "completed"
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {queue.state}
                      </Badge>
                    </TableCell>
                    <TableCell>{queue.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
