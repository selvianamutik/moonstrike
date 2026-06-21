"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, Send, UserCircle, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { ChatAttachments } from "@/components/chat/ChatAttachments";
import {
  ChatComposerTools,
  deleteChatImageAttachment,
  uploadChatComposerAttachments,
  type ChatComposerAttachment,
} from "@/components/chat/ChatComposerTools";
import { useUnreadDocumentTitle } from "@/hooks/useUnreadDocumentTitle";
import { notifyChatUpdated, subscribeToChatUpdates } from "@/lib/chat-events";
import type { ChatMessage, ChatTicket } from "@/lib/chat";

type CreateChatType = "order" | "support";

type ChatCandidate = {
  type: CreateChatType;
  value: string;
  label: string;
  detail: string;
  meta: string;
};

function threadLabel(ticket: ChatTicket) {
  return ticket.orderRef ? `[Order ${ticket.orderRef}]` : "[Support]";
}

function initialsFromName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "O").concat(parts[1]?.[0] ?? "C").toUpperCase();
}

function draftOrderTicket(orderRef: string, customerName = "Order customer", customerEmail: string | null = null): ChatTicket {
  const now = new Date().toISOString();
  const name = customerName.trim() || "Order customer";
  return {
    id: `draft:${orderRef}`,
    orderId: null,
    orderRef,
    userId: null,
    sessionId: null,
    subject: `Order ${orderRef}`,
    status: "open",
    createdAt: now,
    updatedAt: now,
    customerName: name,
    customerEmail,
    customerInitials: initialsFromName(name),
    latestMessage: "",
    latestMessageAt: null,
    unreadCount: 0,
  };
}

function supportDraftId(customerEmail: string) {
  return `draft:support:${encodeURIComponent(customerEmail.trim().toLowerCase())}`;
}

function draftSupportTicket(customerEmail: string): ChatTicket {
  const now = new Date().toISOString();
  const email = customerEmail.trim().toLowerCase();
  const name = email || "Customer";
  return {
    id: supportDraftId(email),
    orderId: null,
    orderRef: null,
    userId: null,
    sessionId: null,
    subject: "General Support",
    status: "open",
    createdAt: now,
    updatedAt: now,
    customerName: name,
    customerEmail: email,
    customerInitials: initialsFromName(name),
    latestMessage: "",
    latestMessageAt: null,
    unreadCount: 0,
  };
}

function isDraftTicketId(ticketId: string) {
  return ticketId.startsWith("draft:");
}

function isDraftSupportTicketId(ticketId: string) {
  return ticketId.startsWith("draft:support:");
}

function formatTime(value: string | null) {
  if (!value) return "No messages";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isUserScrollEvent(event: UIEvent<HTMLDivElement>) {
  return event.nativeEvent.isTrusted;
}

export default function MessagesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagePaneRef = useRef<HTMLDivElement | null>(null);
  const readInFlightRef = useRef<Set<string>>(new Set());
  const lastReadPostAtRef = useRef<Map<string, number>>(new Map());
  const seenRealtimeMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);
  const initialUrlParamsConsumedRef = useRef(false);
  const ticketFromUrl = searchParams.get("ticket");
  const orderFromUrl = searchParams.get("order");
  const customerFromUrl = searchParams.get("customer");
  const emailFromUrl = searchParams.get("email");
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [selectedId, setSelectedId] = useState(ticketFromUrl ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [createChatType, setCreateChatType] = useState<CreateChatType>(orderFromUrl ? "order" : "support");
  const [createSearch, setCreateSearch] = useState(orderFromUrl ?? emailFromUrl ?? "");
  const [createCandidates, setCreateCandidates] = useState<ChatCandidate[]>([]);
  const [isLoadingCreateCandidates, setIsLoadingCreateCandidates] = useState(false);
  const [createChatError, setCreateChatError] = useState("");
  const [error, setError] = useState("");
  const [sendFailedMessage, setSendFailedMessage] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [selectedId, tickets],
  );
  const unreadMessageCount = useMemo(
    () => tickets.reduce((total, ticket) => total + ticket.unreadCount, 0),
    [tickets],
  );

  useUnreadDocumentTitle(unreadMessageCount, "Messages - MoonStrike Admin");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!createChatOpen) return;

    let canceled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoadingCreateCandidates(true);
      setCreateChatError("");

      try {
        const params = new URLSearchParams({ type: createChatType, q: createSearch });
        const response = await fetch(`/api/admin/messages/candidates?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));

        if (canceled) return;
        if (!response.ok) {
          setCreateCandidates([]);
          setCreateChatError(payload.error ?? "Unable to load chat options.");
          return;
        }

        setCreateCandidates(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        if (!canceled) {
          setCreateCandidates([]);
          setCreateChatError("Unable to load chat options.");
        }
      } finally {
        if (!canceled) setIsLoadingCreateCandidates(false);
      }
    }, 250);

    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [createChatOpen, createChatType, createSearch]);

  function isNearMessageBottom() {
    const pane = messagePaneRef.current;
    if (!pane) return true;
    return pane.scrollHeight - pane.scrollTop - pane.clientHeight < 120;
  }

  function scrollMessagesToBottom(behavior: ScrollBehavior = "auto") {
    window.requestAnimationFrame(() => {
      const pane = messagePaneRef.current;
      if (!pane) return;
      pane.scrollTo({ top: pane.scrollHeight, behavior });
    });
  }

  function updateTicketPreviewFromMessages(incomingMessages: ChatMessage[], { incrementUnread = false }: { incrementUnread?: boolean } = {}) {
    if (incomingMessages.length === 0) return;

    setTickets((current) =>
      current
        .map((ticket) => {
          const ticketMessages = incomingMessages
            .filter((message) => message.ticketId === ticket.id)
            .sort((left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime());
          const latestMessage = ticketMessages[0];
          if (!latestMessage) return ticket;

          const latestTimestamp = new Date(latestMessage.sentAt).getTime();
          const currentTimestamp = new Date(ticket.latestMessageAt ?? ticket.updatedAt).getTime();
          const messageIsNewer = latestTimestamp >= currentTimestamp;
          const unreadIncrease = incrementUnread
            ? ticketMessages.filter((message) => message.senderRole === "customer").length
            : 0;

          return {
            ...ticket,
            latestMessage: messageIsNewer ? latestMessage.content || "Attachment" : ticket.latestMessage,
            latestMessageAt: messageIsNewer ? latestMessage.sentAt : ticket.latestMessageAt,
            updatedAt: messageIsNewer ? latestMessage.sentAt : ticket.updatedAt,
            unreadCount: ticket.unreadCount + unreadIncrease,
          };
        })
        .sort((left, right) => new Date(right.latestMessageAt ?? right.updatedAt).getTime() - new Date(left.latestMessageAt ?? left.updatedAt).getTime()),
    );
  }

  const appendMessage = useCallback((message: ChatMessage) => {
    if (seenRealtimeMessageIdsRef.current.has(message.id)) return;
    seenRealtimeMessageIdsRef.current.add(message.id);

    const shouldScroll = isNearMessageBottom();
    setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    updateTicketPreviewFromMessages([message], { incrementUnread: message.senderRole === "customer" });
    if (shouldScroll) scrollMessagesToBottom("smooth");
  }, []);

  async function markTicketRead(ticketId: string, { force = false }: { force?: boolean } = {}) {
    let shouldPost = false;
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;
        shouldPost = ticket.unreadCount > 0;
        return { ...ticket, unreadCount: 0 };
      }),
    );

    const now = Date.now();
    const lastPostAt = lastReadPostAtRef.current.get(ticketId) ?? 0;
    const isThrottled = force && now - lastPostAt < 2_000;
    if ((!shouldPost && !force) || isThrottled || readInFlightRef.current.has(ticketId)) return;

    lastReadPostAtRef.current.set(ticketId, now);
    readInFlightRef.current.add(ticketId);
    await fetch(`/api/admin/messages/${ticketId}/read`, { method: "POST" }).catch(() => null);
    readInFlightRef.current.delete(ticketId);
    window.dispatchEvent(new Event("moonstrike:admin-messages-read"));
  }

  const loadTickets = useCallback(async (preferredId?: string | null, preferredOrderRef?: string | null, { quiet = false }: { quiet?: boolean } = {}) => {
    if (!quiet) setError("");

    try {
      const response = await fetch("/api/admin/messages", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load tickets.");
        return;
      }

      const nextTickets = Array.isArray(payload.tickets) ? payload.tickets : [];
      const orderTicketId = preferredOrderRef
        ? nextTickets.find((ticket: ChatTicket) => ticket.orderRef === preferredOrderRef)?.id ?? ""
        : "";
      const draftTicket = preferredOrderRef && !orderTicketId ? draftOrderTicket(preferredOrderRef, customerFromUrl ?? undefined, emailFromUrl) : null;
      setTickets((current) => {
        const currentDraftTickets = current.filter((ticket) => isDraftTicketId(ticket.id));
        return draftTicket
          ? [draftTicket, ...nextTickets]
          : [...currentDraftTickets.filter((draft) => !nextTickets.some((ticket: ChatTicket) => ticket.orderRef === draft.orderRef)), ...nextTickets];
      });

      const nextSelectedId = preferredId || orderTicketId || (draftTicket ? draftTicket.id : "") || selectedId || "";
      if (nextSelectedId && nextSelectedId !== selectedId) {
        setSelectedId(nextSelectedId);
      }
      if ((preferredId || orderTicketId) && !selectedId && nextSelectedId) {
        await loadMessages(nextSelectedId);
      }
    } catch {
      setError("Unable to reach messages.");
    } finally {
      setIsLoadingTickets(false);
    }
  }, [customerFromUrl, emailFromUrl, selectedId]);

  async function loadMessages(ticketId: string, { quiet = false }: { quiet?: boolean } = {}) {
    setSelectedId(ticketId);
    if (isDraftTicketId(ticketId)) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }
    void markTicketRead(ticketId, { force: true });
    if (!quiet) {
      setIsLoadingMessages(true);
      setError("");
    }

    try {
      const response = await fetch(`/api/admin/messages/${ticketId}/messages?limit=10`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load messages.");
        return;
      }

      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setHasMoreMessages(Boolean(payload.hasMore));
      if (!quiet) scrollMessagesToBottom();
    } catch {
      setError("Unable to reach messages.");
    } finally {
      if (!quiet) setIsLoadingMessages(false);
    }
  }

  async function loadOlderMessages() {
    if (!selectedId || !hasMoreMessages || isLoadingOlder || messages.length === 0) return;

    const pane = messagePaneRef.current;
    const previousHeight = pane?.scrollHeight ?? 0;
    const oldest = messages[0]?.sentAt;
    if (!oldest) return;

    setIsLoadingOlder(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "10", before: oldest });
      const response = await fetch(`/api/admin/messages/${selectedId}/messages?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load older messages.");
        return;
      }

      const older = Array.isArray(payload.messages) ? payload.messages : [];
      if (older.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      setMessages((current) => {
        const existing = new Set(current.map((message) => message.id));
        return [...older.filter((message: ChatMessage) => !existing.has(message.id)), ...current];
      });
      setHasMoreMessages(Boolean(payload.hasMore));

      window.requestAnimationFrame(() => {
        if (!pane) return;
        pane.scrollTop = pane.scrollHeight - previousHeight;
      });
    } catch {
      setError("Unable to reach messages.");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function refreshLatestMessages(ticketId: string) {
    if (document.visibilityState !== "visible") return;
    if (isDraftTicketId(ticketId)) return;

    try {
      const response = await fetch(`/api/admin/messages/${ticketId}/messages?limit=10`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) return;

      const latest = Array.isArray(payload.messages) ? payload.messages : [];
      const shouldScroll = isNearMessageBottom();
      const existing = new Set(messagesRef.current.map((message) => message.id));
      const nextMessages = latest.filter((message: ChatMessage) => !existing.has(message.id));
      nextMessages.forEach((message: ChatMessage) => seenRealtimeMessageIdsRef.current.add(message.id));
      updateTicketPreviewFromMessages(nextMessages, { incrementUnread: true });
      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id));
        const filteredNextMessages = nextMessages.filter((message: ChatMessage) => !currentIds.has(message.id));
        return filteredNextMessages.length > 0 ? [...current, ...filteredNextMessages] : current;
      });
      if (shouldScroll) scrollMessagesToBottom("smooth");
    } catch {
      // Polling refresh should stay quiet.
    }
  }

  function handleMessageScroll(event: UIEvent<HTMLDivElement>) {
    if (event.currentTarget.scrollTop <= 24) {
      void loadOlderMessages();
    }

    if (selectedId && isUserScrollEvent(event) && isNearMessageBottom()) {
      void markTicketRead(selectedId, { force: true });
    }
  }

  function markSelectedTicketReadByActivity() {
    if (!selectedId || isDraftTicketId(selectedId)) return;
    void markTicketRead(selectedId, { force: true });
  }

  function openOrderChat(orderRefValue: string) {
    const orderRef = orderRefValue.trim();
    if (!orderRef) {
      setCreateChatError("Enter an order reference first.");
      return;
    }

    const existing = tickets.find((ticket) => ticket.orderRef?.toLowerCase() === orderRef.toLowerCase() && !isDraftTicketId(ticket.id));
    if (existing) {
      setCreateChatOpen(false);
      setCreateChatError("");
      void loadMessages(existing.id);
      return;
    }

    const draft = draftOrderTicket(orderRef);
    setTickets((current) => (current.some((ticket) => ticket.id === draft.id) ? current : [draft, ...current]));
    setSelectedId(draft.id);
    setMessages([]);
    setHasMoreMessages(false);
    setCreateChatOpen(false);
    setCreateChatError("");
  }

  function openSupportChat(customerEmailValue: string) {
    const customerEmail = customerEmailValue.trim().toLowerCase();
    if (!customerEmail || !customerEmail.includes("@")) {
      setCreateChatError("Enter a valid customer email first.");
      return;
    }

    const existing = tickets.find(
      (ticket) => !ticket.orderRef && !isDraftTicketId(ticket.id) && ticket.customerEmail?.toLowerCase() === customerEmail,
    );
    if (existing) {
      setCreateChatOpen(false);
      setCreateChatError("");
      void loadMessages(existing.id);
      return;
    }

    const draft = draftSupportTicket(customerEmail);
    setTickets((current) => (current.some((ticket) => ticket.id === draft.id) ? current : [draft, ...current]));
    setSelectedId(draft.id);
    setMessages([]);
    setHasMoreMessages(false);
    setCreateChatOpen(false);
    setCreateChatError("");
  }

  async function sendMessage() {
    if (!selectedId || (!draft.trim() && attachments.length === 0)) return;

    setIsSending(true);
    setError("");
    setSendFailedMessage("");
    let uploadedImages: Awaited<ReturnType<typeof uploadChatComposerAttachments>>["uploadedImages"] = [];

    try {
      let ticketId = selectedId;
      if (isDraftSupportTicketId(ticketId)) {
        const customerEmail = decodeURIComponent(ticketId.slice("draft:support:".length));
        const ticketResponse = await fetch("/api/admin/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerEmail }),
        });
        const ticketPayload = await ticketResponse.json().catch(() => ({}));

        if (!ticketResponse.ok || !ticketPayload.ticket?.id) {
          setSendFailedMessage(ticketPayload.error ?? "Unable to create support chat.");
          return;
        }

        const ticket = ticketPayload.ticket as ChatTicket;
        ticketId = ticket.id;
        setSelectedId(ticket.id);
        setTickets((current) => [ticket, ...current.filter((item) => item.id !== supportDraftId(customerEmail) && item.id !== ticket.id)]);
      } else if (isDraftTicketId(ticketId)) {
        const orderRef = ticketId.slice("draft:".length);
        const ticketResponse = await fetch("/api/admin/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRef }),
        });
        const ticketPayload = await ticketResponse.json().catch(() => ({}));

        if (!ticketResponse.ok || !ticketPayload.ticket?.id) {
          setSendFailedMessage(ticketPayload.error ?? "Unable to create order chat.");
          return;
        }

        const ticket = ticketPayload.ticket as ChatTicket;
        ticketId = ticket.id;
        setSelectedId(ticket.id);
        setTickets((current) => [ticket, ...current.filter((item) => item.id !== `draft:${orderRef}` && item.id !== ticket.id)]);
      }

      const resolved = await uploadChatComposerAttachments(attachments);
      uploadedImages = resolved.uploadedImages;
      const response = await fetch(`/api/admin/messages/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, attachments: resolved.attachments }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSendFailedMessage(payload.error ?? "Unable to send message.");
        return;
      }

      setDraft("");
      setAttachments([]);
      appendMessage(payload.message);
      void markTicketRead(ticketId, { force: true });
      notifyChatUpdated();
      scrollMessagesToBottom("smooth");
    } catch (sendError) {
      await Promise.all(uploadedImages.map(deleteChatImageAttachment));
      setSendFailedMessage(sendError instanceof Error ? sendError.message : "Unable to reach messages.");
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (initialUrlParamsConsumedRef.current) return;
    initialUrlParamsConsumedRef.current = true;
    loadTickets(ticketFromUrl, orderFromUrl);
    if (ticketFromUrl || orderFromUrl) {
      router.replace("/admin/messages", { scroll: false });
    }
  }, [loadTickets, orderFromUrl, router, ticketFromUrl]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadTickets(selectedId, null, { quiet: true });
    }, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadTickets, selectedId]);

  useEffect(() => {
    if (!selectedId || isDraftTicketId(selectedId)) return;
    const handleFocus = () => void refreshLatestMessages(selectedId);

    const intervalId = window.setInterval(() => {
      void refreshLatestMessages(selectedId);
    }, 1_500);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [selectedId]);

  useEffect(() => {
    return subscribeToChatUpdates(() => {
      void loadTickets(selectedId, null, { quiet: true });
      if (selectedId && !isDraftTicketId(selectedId)) {
        void refreshLatestMessages(selectedId);
      }
    });
  }, [loadTickets, selectedId]);

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-[760px] w-full flex-col gap-4">
      <AdminPageHeader
        breadcrumbs={[{ label: "Support" }, { label: "Messages", active: true }]}
        title="Support Inbox"
        actions={
          <AdminButton type="button" variant="secondary" onClick={() => setCreateChatOpen(true)} className="gap-2">
            <MessageSquarePlus size={16} />
            Create Chat
          </AdminButton>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)]">
          <div className="flex items-center gap-2 border-b border-[var(--ms-accent)] p-4">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-bold text-white">Support</span>
            <span className="ml-auto text-xs text-green-500">online</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingTickets ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg bg-white/10" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-5 text-sm text-[#64748B]">No support conversations yet.</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    if (ticket.id !== selectedId) {
                      setSelectedId(ticket.id);
                    } else {
                      void markTicketRead(ticket.id, { force: true });
                    }
                  }}
                  className={`w-full border-b border-[var(--ms-accent)] p-4 text-left transition-colors hover:bg-[#111827] ${
                    selectedId === ticket.id ? "border-l-2 border-l-[#8B5CF6] bg-[#8B5CF6]/10" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-[#22D3EE]">{threadLabel(ticket)}</span>
                    <span className="text-xs text-[#64748B]">{formatTime(ticket.latestMessageAt ?? ticket.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 text-sm font-medium text-white">{ticket.customerName}</div>
                    {ticket.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1.5 text-[10px] font-black leading-none text-white">
                        {ticket.unreadCount > 9 ? "9+" : ticket.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--ms-text-secondary)]">{ticket.subject}</div>
                  <p className="mt-1 truncate text-xs text-[#64748B]">{ticket.latestMessage || "No messages yet."}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)]">
          {selectedTicket ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--ms-accent)] p-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold text-[#22D3EE]">{threadLabel(selectedTicket)}</p>
                  <h2 className="font-bold text-white">{selectedTicket.customerName}</h2>
                  <p className="text-xs text-[#64748B]">{selectedTicket.customerEmail ?? "Anonymous customer"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(true)}
                  className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                  aria-label="Open customer details"
                  title="Customer details"
                >
                  <UserCircle size={17} />
                </button>
              </div>

              <div
                ref={messagePaneRef}
                onClick={markSelectedTicketReadByActivity}
                onScroll={handleMessageScroll}
                className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
              >
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    <div className="h-16 w-2/3 animate-pulse rounded-xl bg-white/10" />
                    <div className="ml-auto h-16 w-2/3 animate-pulse rounded-xl bg-white/10" />
                    <div className="h-16 w-1/2 animate-pulse rounded-xl bg-white/10" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-[#64748B]">No messages in this conversation yet.</div>
                ) : (
                  <>
                    {isLoadingOlder ? (
                      <div className="mx-auto h-8 w-40 animate-pulse rounded-md bg-white/10" />
                    ) : hasMoreMessages ? (
                      <p className="text-center text-xs text-[#64748B]">Scroll up to load older messages</p>
                    ) : null}

                    {messages.map((message) => {
                      const adminMessage = message.senderRole === "admin";
                      return (
                        <div key={message.id} className={`flex ${adminMessage ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[82%] rounded-xl px-4 py-3 ${
                              adminMessage
                                ? "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white"
                                : "border border-[var(--ms-accent)] bg-[var(--ms-primary)] text-[#F1F5F9]"
                            }`}
                          >
                            {message.content ? <p className="text-sm leading-6">{message.content}</p> : null}
                            <ChatAttachments attachments={message.attachments} />
                            <div className="mt-2 text-right text-[10px] opacity-70">{formatTime(message.sentAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="border-t border-[var(--ms-accent)] p-5">
                {sendFailedMessage ? (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    <span>{sendFailedMessage}</span>
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={isSending}
                      className="shrink-0 rounded-md border border-red-300/30 px-2 py-1 font-bold uppercase tracking-[0.08em] hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
                <ChatComposerTools attachments={attachments} disabled={isSending} onAttachmentsChange={setAttachments} onError={setError} />
                <div className="mt-3 flex gap-2">
                  <textarea
                    value={draft}
                    onFocus={markSelectedTicketReadByActivity}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      markSelectedTicketReadByActivity();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="min-h-[48px] flex-1 resize-none rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || (!draft.trim() && attachments.length === 0)}
                    className="flex items-center gap-2 self-end rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[#64748B]">Select a conversation</div>
          )}
        </main>
      </div>

      {selectedTicket && customerModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4">
          <section className="w-full max-w-md rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#22D3EE]">Customer Details</p>
                <h2 className="mt-2 text-xl font-bold text-white">{selectedTicket.customerName}</h2>
                <p className="mt-1 text-sm text-[#64748B]">{selectedTicket.customerEmail ?? "Anonymous customer"}</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                aria-label="Close customer details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#22D3EE]/30 bg-[var(--ms-accent)] text-lg font-bold text-white">
                {selectedTicket.customerInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{selectedTicket.customerName}</p>
                <p className="truncate text-xs text-[#64748B]">{selectedTicket.customerEmail ?? "Anonymous customer"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--ms-text-secondary)]">Conversation</p>
              <p className="mt-2 text-sm font-bold text-white">{threadLabel(selectedTicket)}</p>
              <p className="mt-2 text-xs text-[#64748B]">Updated {formatTime(selectedTicket.updatedAt)}</p>
              {selectedTicket.latestMessage ? (
                <p className="mt-3 line-clamp-2 text-sm text-[var(--ms-text-secondary)]">{selectedTicket.latestMessage}</p>
              ) : null}
            </div>

            {selectedTicket.orderRef ? (
              <Link
                href={`/admin/orders/${selectedTicket.orderRef}`}
                onClick={() => setCustomerModalOpen(false)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md border border-[var(--ms-accent)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ms-text-secondary)] hover:border-[#8B5CF6] hover:text-white"
              >
                View Related Order
              </Link>
            ) : null}
          </section>
        </div>
      ) : null}

      {createChatOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4">
          <section className="w-full max-w-lg rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#22D3EE]">Create Chat</p>
                <h2 className="mt-2 text-xl font-bold text-white">Open a conversation</h2>
                <p className="mt-1 text-sm text-[#64748B]">Existing order or support chats will be opened instead of duplicated.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateChatOpen(false);
                  setCreateChatError("");
                }}
                className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                aria-label="Close create chat"
              >
                <X size={16} />
              </button>
            </div>

            {createChatError ? (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{createChatError}</p>
            ) : null}

            <div className="mt-6 grid gap-4">
              <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ms-text-secondary)]" htmlFor="admin-create-chat-type">
                  Chat type
                  <select
                    id="admin-create-chat-type"
                    value={createChatType}
                    onChange={(event) => {
                      setCreateChatType(event.target.value as CreateChatType);
                      setCreateSearch("");
                      setCreateChatError("");
                    }}
                    className="h-11 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-3 text-sm normal-case tracking-normal text-white outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="support">Support</option>
                    <option value="order">Order</option>
                  </select>
                </label>

                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ms-text-secondary)]" htmlFor="admin-create-chat-search">
                  Search
                  <input
                    id="admin-create-chat-search"
                    value={createSearch}
                    onChange={(event) => setCreateSearch(event.target.value)}
                    placeholder={createChatType === "order" ? "Search order ref, customer, service..." : "Search customer name or email..."}
                    className="h-11 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-3 text-sm normal-case tracking-normal text-white outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </label>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)]">
                {isLoadingCreateCandidates ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="h-14 animate-pulse rounded-md bg-white/10" />
                    ))}
                  </div>
                ) : createCandidates.length === 0 ? (
                  <p className="p-4 text-sm text-[#64748B]">No matching {createChatType === "order" ? "orders" : "customers"} found.</p>
                ) : (
                  createCandidates.map((candidate) => (
                    <button
                      key={`${candidate.type}:${candidate.value}`}
                      type="button"
                      onClick={() => {
                        if (candidate.type === "order") {
                          openOrderChat(candidate.value);
                        } else {
                          openSupportChat(candidate.value);
                        }
                      }}
                      className="w-full border-b border-[var(--ms-accent)] px-4 py-3 text-left last:border-b-0 hover:bg-[#111827]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold text-white">{candidate.label}</span>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#22D3EE]">{candidate.meta}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[#64748B]">{candidate.detail}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
