import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
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
import { emailEvents, emailOutbox, emailOutboxStatus } from "@/db/schema";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Email",
};

interface SearchParams {
  event?: string;
  q?: string;
  status?: string;
}

export default async function OrbitEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { event, q, status } = await searchParams;
  const term = q?.trim();
  const pattern = term ? `%${term}%` : null;

  const outboxConditions: SQL[] = [];
  const statusValue = emailOutboxStatus.enumValues.find((v) => v === status);
  if (statusValue) {
    outboxConditions.push(eq(emailOutbox.status, statusValue));
  }
  if (pattern) {
    const match = or(
      ilike(sql`${emailOutbox.payload}->>'to'`, pattern),
      ilike(sql`${emailOutbox.payload}->>'subject'`, pattern)
    );
    if (match) {
      outboxConditions.push(match);
    }
  }

  const eventConditions: SQL[] = [];
  if (event) {
    eventConditions.push(eq(emailEvents.eventType, event));
  }
  if (pattern) {
    eventConditions.push(ilike(emailEvents.recipient, pattern));
  }

  const [outbox, events, eventTypes] = await Promise.all([
    db
      .select()
      .from(emailOutbox)
      .where(outboxConditions.length > 0 ? and(...outboxConditions) : undefined)
      .orderBy(desc(emailOutbox.createdAt))
      .limit(50),
    db
      .select()
      .from(emailEvents)
      .where(eventConditions.length > 0 ? and(...eventConditions) : undefined)
      .orderBy(desc(emailEvents.receivedAt))
      .limit(50),
    db
      .selectDistinct({ eventType: emailEvents.eventType })
      .from(emailEvents)
      .orderBy(emailEvents.eventType),
  ]);

  return (
    <div>
      <OrbitPageHeader
        description="Transactional email queue and inbound delivery events."
        eyebrow="Admin"
        title="Email"
      />

      <div className="mb-6">
        <AdminFilterBar
          searchPlaceholder="Search recipient or subject..."
          selects={[
            {
              label: "Outbox status",
              param: "status",
              options: emailOutboxStatus.enumValues.map((v) => ({
                label: v,
                value: v,
              })),
            },
            {
              label: "Event type",
              param: "event",
              options: eventTypes.map((e) => ({
                label: e.eventType,
                value: e.eventType,
              })),
            },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outbox</CardTitle>
            <CardDescription>
              Queued and delivered transactional emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outbox.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-muted-foreground text-xs"
                      colSpan={4}
                    >
                      No emails match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {outbox.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>{email.payload.to}</TableCell>
                    <TableCell>{email.payload.subject}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          email.status === "sent"
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{email.attemptCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Inbound webhook events from your SMTP provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-muted-foreground text-xs"
                      colSpan={3}
                    >
                      No events match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>{event.recipient ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(event.receivedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
