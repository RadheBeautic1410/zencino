import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { SupportInbox } from "@/components/admin/support-inbox";
import {
  getSupportTicketDetails,
  getSupportTicketsList,
} from "@/lib/commerce/support";

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
  let initialMessages: any[] = [];
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
        eyebrow="Admin Operations"
        title="Customer Support Inbox"
        description="Review inbound inquiries, coordinate staff notes, and resolve customer orders."
      />

      <SupportInbox
        tickets={tickets}
        initialSelectedTicket={initialSelectedTicket}
        initialMessages={initialMessages}
        initialOrder={initialOrder}
      />
    </div>
  );
}
