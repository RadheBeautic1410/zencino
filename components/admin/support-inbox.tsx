"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChatCircleText,
  CheckCircle,
  Clock,
  Envelope,
  Lock,
  NotePencil,
  PaperPlaneTilt,
  Phone,
  Receipt,
  User,
  WarningCircle,
} from "@phosphor-icons/react";
import { addSupportMessageAction, updateTicketStatusAction } from "@/app/actions/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  orderNumber: string | null;
  orderId: string | null;
  createdAt: Date;
}

interface SupportMessage {
  id: string;
  authorName: string;
  body: string;
  visibility: string;
  sentAt: Date | null;
  createdAt: Date;
}

interface Props {
  tickets: SupportTicket[];
  initialSelectedTicket: SupportTicket | null;
  initialMessages: SupportMessage[];
  initialOrder: {
    id: string;
    orderNumber: string;
    status: string;
    totalMinor: number;
    createdAt: Date;
  } | null;
}

export function SupportInbox({
  tickets,
  initialSelectedTicket,
  initialMessages,
  initialOrder,
}: Props) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(initialSelectedTicket);
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);
  const [order, setOrder] = useState(initialOrder);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [messageBody, setMessageBody] = useState("");
  const [visibility, setVisibility] = useState<"customer" | "internal">("customer");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setActionError(null);
    setMessageBody("");
    // Update messages by fetching or reloading
    window.location.href = `/admin/support?ticket=${ticket.ticketNumber}&status=${statusFilter}`;
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !messageBody.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", selectedTicket.id);
      formData.set("body", messageBody);
      formData.set("visibility", visibility);

      const res = await addSupportMessageAction(formData);
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            authorName: "Staff Member",
            body: messageBody,
            visibility,
            sentAt: visibility === "customer" ? new Date() : null,
            createdAt: new Date(),
          },
        ]);
        setMessageBody("");
      } else {
        setActionError(res.error || "Failed to send message");
      }
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedTicket) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", selectedTicket.id);
      formData.set("status", newStatus);

      const res = await updateTicketStatusAction(formData);
      if (res.success) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      } else {
        setActionError(res.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 border border-border p-1 rounded-xl bg-card">
          {["all", "open", "in_progress", "resolved", "closed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-ui transition-colors ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search ticket, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Ticket List (4 cols) */}
        <div className="lg:col-span-4 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          {filteredTickets.length === 0 ? (
            <div className="border border-border p-8 rounded-xl bg-card text-center text-xs text-muted-foreground">
              No tickets found matching this filter.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTicket(t)}
                  className={`w-full text-left p-4 border rounded-xl transition-all space-y-1.5 ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-foreground">
                      {t.ticketNumber}
                    </span>
                    <Badge
                      variant={
                        t.status === "open"
                          ? "destructive"
                          : t.status === "in_progress"
                          ? "default"
                          : "secondary"
                      }
                      className="text-2xs uppercase"
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="font-bold text-xs text-foreground truncate">{t.subject}</p>
                  <div className="flex items-center justify-between text-2xs text-muted-foreground">
                    <span className="truncate">{t.name}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  {t.orderNumber && (
                    <div className="pt-1 flex items-center gap-1 text-2xs text-primary font-mono font-medium">
                      <Receipt size={12} />
                      <span>{t.orderNumber}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Ticket Detail & Conversation Thread (8 cols) */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <Card className="flex flex-col h-[75vh]">
              {/* Header */}
              <CardHeader className="border-b border-border pb-4 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-mono font-bold">
                        {selectedTicket.ticketNumber}
                      </CardTitle>
                      <Badge
                        variant={
                          selectedTicket.status === "open"
                            ? "destructive"
                            : selectedTicket.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                        className="text-2xs uppercase"
                      >
                        {selectedTicket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {selectedTicket.subject}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <select
                      value={selectedTicket.status}
                      disabled={isPending}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="border border-border bg-background px-2.5 py-1 text-xs rounded font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Customer Contact & Order Strip */}
                <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-primary" />
                    <span className="font-semibold text-foreground">{selectedTicket.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Envelope size={14} className="text-primary" />
                    <span>{selectedTicket.email}</span>
                  </div>
                  {selectedTicket.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-primary" />
                      <span>{selectedTicket.phone}</span>
                    </div>
                  )}
                  {selectedTicket.orderNumber && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Receipt size={14} className="text-primary" />
                      <span className="font-mono">{selectedTicket.orderNumber}</span>
                      {order && (
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline font-semibold ml-1"
                        >
                          (View Order →)
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Message Thread Body */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isInternal = msg.visibility === "internal";
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isInternal
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-muted/20 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {msg.authorName}
                          </span>
                          {isInternal && (
                            <Badge variant="outline" className="text-2xs gap-1 border-amber-500/40 text-amber-600">
                              <Lock size={10} /> Internal Staff Note
                            </Badge>
                          )}
                        </div>
                        <span className="text-2xs text-muted-foreground flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(msg.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
              </CardContent>

              {/* Reply / Staff Note Input Footer */}
              <div className="border-t border-border p-4 bg-muted/10 shrink-0 space-y-3">
                {actionError && (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive rounded">
                    <WarningCircle size={16} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("customer")}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-ui rounded-md transition-colors ${
                        visibility === "customer"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Customer Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("internal")}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-ui rounded-md transition-colors flex items-center gap-1 ${
                        visibility === "internal"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Lock size={12} />
                      Staff Note (Private)
                    </button>
                  </div>
                  <span className="text-2xs text-muted-foreground">
                    {visibility === "customer"
                      ? "Customer will see this reply in their ticket history"
                      : "Visible only to admin operators"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={
                      visibility === "customer"
                        ? "Type customer response..."
                        : "Type internal staff note..."
                    }
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="flex-1 border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-lg resize-none"
                  />
                  <Button
                    disabled={isPending || !messageBody.trim()}
                    onClick={handleSendMessage}
                    className="self-end px-4 gap-1.5 text-xs"
                  >
                    <PaperPlaneTilt size={14} />
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="border border-border p-12 rounded-xl bg-card text-center space-y-3">
              <ChatCircleText size={40} className="mx-auto text-muted-foreground" />
              <h3 className="font-bold text-base">Select a Ticket</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Choose an inquiry from the list on the left to review customer messages, post internal staff notes, or reply to the customer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
