import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { SupportInbox } from "@/components/admin/support-inbox";
import {
  getSupportTicketDetails,
  getSupportTicketsList,
} from "@/lib/commerce/support";

type TicketDetails = Awaited<ReturnType<typeof getSupportTicketDetails>>;

interface Props {
  searchParams: Promise<{ ticket?: string; status?: string; search?: string }>;
}

export const metadata = {
  title: "Support Inquiries - Zencino Admin",
};

export default async function AdminSupportPage({ searchParams }: Props) {
  const { ticket: ticketParam, status, search } = await searchParams;

  const tickets = await getSupportTicketsList({ status, search });

  // Default to the first ticket if none specified
  const targetTicketNumber = ticketParam || tickets[0]?.ticketNumber;

  let initialSelectedTicket = null;
  let initialMessages: TicketDetails["messages"] = [];
  let initialOrder = null;

  if (targetTicketNumber) {
    const details = await getSupportTicketDetails(targetTicketNumber);
    initialSelectedTicket = details.ticket;
    initialMessages = details.messages;
    initialOrder = details.order;
  }

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Review inbound inquiries, coordinate staff notes, and resolve customer orders."
        eyebrow="Admin Operations"
        title="Customer Support Inbox"
      />

      <SupportInbox
        initialMessages={initialMessages}
        initialOrder={initialOrder}
        initialSelectedTicket={initialSelectedTicket}
        tickets={tickets}
      />
    </div>
  );
}
