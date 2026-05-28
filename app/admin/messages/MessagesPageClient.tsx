"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Paperclip,
  Send,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  Smile,
  MoreHorizontal,
  Download,
  Ban,
  RefreshCw,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  supportTickets,
  getMessagesForTicket,
  getCustomerById,
  adminOrders,
} from "@/lib/admin-mock";

function threadLabel(ticket: (typeof supportTickets)[0]) {
  if (ticket.threadType === "order" && ticket.orderId) {
    return `[Order ${ticket.orderId}]`;
  }
  return "[Support]";
}

export default function MessagesPageClient() {
  const searchParams = useSearchParams();
  const ticketFromUrl = searchParams.get("ticket");
  const [selectedId, setSelectedId] = useState(ticketFromUrl ?? supportTickets[0]?.id ?? "");

  useEffect(() => {
    if (ticketFromUrl) setSelectedId(ticketFromUrl);
  }, [ticketFromUrl]);

  const selectedTicket = supportTickets.find((t) => t.id === selectedId);
  const messages = getMessagesForTicket(selectedId);
  const customer = selectedTicket ? getCustomerById(selectedTicket.customerId) : undefined;
  const userOrders = customer
    ? adminOrders.filter((o) => o.customerEmail === customer.email).slice(0, 3)
    : [];

  const sortedTickets = useMemo(
    () => [...supportTickets].sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1)),
    []
  );

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
      <AdminPageHeader breadcrumbs={[{ label: "Support" }, { label: "Messages", active: true }]} title="Support Inbox" />

      <div className="flex flex-1 min-h-0 gap-4">
        <aside className="w-72 shrink-0 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--ms-accent)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-bold text-white">Support</span>
            <span className="text-xs text-green-500 ml-auto">online</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full text-left p-4 border-b border-[var(--ms-accent)] hover:bg-[#111827] transition-colors ${
                  selectedId === ticket.id ? "bg-[#8B5CF6]/10 border-l-2 border-l-[#8B5CF6]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#22D3EE]">{threadLabel(ticket)}</span>
                  <span className="text-xs text-[#64748B]">{ticket.timeAgo}</span>
                </div>
                <div className="text-sm font-medium text-white">{ticket.userName}</div>
                <div className="text-xs text-[var(--ms-text-secondary)] truncate mt-0.5">{ticket.subject}</div>
                <p className="text-xs text-[#64748B] truncate mt-1">{ticket.preview}</p>
                {ticket.unread && <span className="inline-block w-2 h-2 rounded-full bg-[#8B5CF6] mt-2" />}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl flex flex-col overflow-hidden">
          {selectedTicket && customer ? (
            <>
              <div className="p-4 border-b border-[var(--ms-accent)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#22D3EE] mb-1">{threadLabel(selectedTicket)}</p>
                  <h2 className="text-white font-bold">
                    {customer.name} {customer.tag}
                  </h2>
                  {customer.tier && <p className="text-xs text-[#22D3EE] uppercase tracking-wide">{customer.tier}</p>}
                </div>
                <button type="button" className="text-[var(--ms-text-secondary)] hover:text-white">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-3 ${
                        msg.sender === "admin"
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white"
                          : "bg-[var(--ms-primary)] text-[#F1F5F9] border border-[var(--ms-accent)]"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.attachment && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                          <Paperclip size={14} />
                          <span className="text-xs">{msg.attachment.name}</span>
                          <span className="text-xs opacity-70">{msg.attachment.size}</span>
                          <Download size={14} className="ml-auto" />
                        </div>
                      )}
                      <div className="text-[10px] opacity-70 mt-1 text-right">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[var(--ms-accent)]">
                <div className="flex gap-2 mb-2">
                  {[Bold, Italic, LinkIcon, List, Smile].map((Icon, i) => (
                    <button key={i} type="button" className="p-1.5 text-[#64748B] hover:text-white rounded">
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    placeholder="Type a message..."
                    className="flex-1 bg-[var(--ms-primary)] border border-[var(--ms-accent)] rounded-lg px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none min-h-[44px]"
                    rows={2}
                  />
                  <button type="button" className="p-3 text-[var(--ms-text-secondary)] hover:text-white self-end">
                    <Paperclip size={18} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white rounded-lg text-sm font-medium self-end"
                  >
                    Send
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#64748B]">Select a conversation</div>
          )}
        </main>

        {customer && (
          <aside className="w-64 shrink-0 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--ms-accent)] border-2 border-[#22D3EE]/30 flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
                {customer.avatarInitials}
              </div>
              <h3 className="text-white font-bold">{customer.name}</h3>
              {customer.location && <p className="text-xs text-[#64748B]">{customer.location}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--ms-primary)] rounded-lg p-3 border border-[var(--ms-accent)] text-center">
                <div className="text-[10px] text-[var(--ms-text-secondary)] uppercase">Orders</div>
                <div className="text-lg font-bold text-white">{customer.ordersCount}</div>
              </div>
              <div className="bg-[var(--ms-primary)] rounded-lg p-3 border border-[var(--ms-accent)] text-center">
                <div className="text-[10px] text-[var(--ms-text-secondary)] uppercase">Spent</div>
                <div className="text-lg font-bold text-[#22D3EE]">{customer.totalSpent}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2">Recent Activity</h4>
              <div className="flex flex-col gap-2">
                {userOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between text-xs bg-[var(--ms-primary)] rounded p-2 border border-[var(--ms-accent)] hover:border-[#8B5CF6]"
                  >
                    <span className="text-white font-mono">{order.id}</span>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[var(--ms-accent)]">
              <AdminButton variant="secondary" className="w-full text-xs">
                Issue Refund
              </AdminButton>
              <AdminButton variant="secondary" className="w-full text-xs">
                <RefreshCw size={14} /> Update Ticket
              </AdminButton>
              <AdminButton variant="danger" className="w-full text-xs">
                <Ban size={14} /> Ban User
              </AdminButton>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
