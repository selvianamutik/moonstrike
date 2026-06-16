"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { MessageSquarePlus, Send, X } from "lucide-react";
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

type ProfileChatClientProps = {
  initialTickets: ChatTicket[];
  chatOrders: Array<{ orderRef: string; label: string }>;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  initialSelectedId: string;
  initialDraftOrderRef: string | null;
};

type CreateChatType = "support" | "order";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ticketLabel(ticket: ChatTicket) {
  return ticket.orderRef ? `Order ${ticket.orderRef}` : "General Support";
}

function draftOrderTicket(orderRef: string): ChatTicket {
  const now = new Date().toISOString();
  return {
    id: `draft:order:${orderRef}`,
    orderId: null,
    orderRef,
    userId: null,
    sessionId: null,
    subject: `Order ${orderRef}`,
    status: "open",
    createdAt: now,
    updatedAt: now,
    customerName: "You",
    customerEmail: null,
    customerInitials: "YO",
    latestMessage: "",
    latestMessageAt: null,
    unreadCount: 0,
  };
}

function draftSupportTicket(): ChatTicket {
  const now = new Date().toISOString();
  return {
    id: "draft:support",
    orderId: null,
    orderRef: null,
    userId: null,
    sessionId: null,
    subject: "General Support",
    status: "open",
    createdAt: now,
    updatedAt: now,
    customerName: "You",
    customerEmail: null,
    customerInitials: "YO",
    latestMessage: "",
    latestMessageAt: null,
    unreadCount: 0,
  };
}

function isDraftTicketId(ticketId: string) {
  return ticketId.startsWith("draft:");
}

function isUserScrollEvent(event: UIEvent<HTMLDivElement>) {
  return event.nativeEvent.isTrusted;
}

export function ProfileChatClient({ initialTickets, chatOrders, initialMessages, initialHasMore, initialSelectedId, initialDraftOrderRef }: ProfileChatClientProps) {
  const messagePaneRef = useRef<HTMLDivElement | null>(null);
  const readInFlightRef = useRef<Set<string>>(new Set());
  const lastReadPostAtRef = useRef<Map<string, number>>(new Map());
  const seenRealtimeMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);
  const createTicketPromiseRef = useRef<Promise<string> | null>(null);
  const initialDraftTicket = initialDraftOrderRef ? draftOrderTicket(initialDraftOrderRef) : null;
  const [tickets, setTickets] = useState(initialDraftTicket ? [initialDraftTicket, ...initialTickets] : initialTickets);
  const [selectedId, setSelectedId] = useState(initialSelectedId || initialDraftTicket?.id || "");
  const [messages, setMessages] = useState(initialMessages);
  const [hasMoreMessages, setHasMoreMessages] = useState(initialHasMore);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [sendFailedMessage, setSendFailedMessage] = useState("");
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [createChatType, setCreateChatType] = useState<CreateChatType>("support");
  const [createSearch, setCreateSearch] = useState("");
  const [createChatError, setCreateChatError] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [selectedId, tickets],
  );
  const unreadMessageCount = useMemo(
    () => tickets.reduce((total, ticket) => total + ticket.unreadCount, 0),
    [tickets],
  );
  const createCandidates = useMemo(() => {
    if (createChatType === "support") {
      return [{ type: "support" as const, value: "support", label: "General Support", detail: "Ask MoonStrike support for help." }];
    }

    const query = createSearch.trim().toLowerCase();
    return chatOrders
      .filter((order) => !query || order.orderRef.toLowerCase().includes(query) || order.label.toLowerCase().includes(query))
      .slice(0, 50)
      .map((order) => ({ type: "order" as const, value: order.orderRef, label: order.orderRef, detail: order.label }));
  }, [chatOrders, createChatType, createSearch]);

  useUnreadDocumentTitle(unreadMessageCount, "Chat - MoonStrike");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
            ? ticketMessages.filter((message) => message.senderRole === "admin").length
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
    updateTicketPreviewFromMessages([message], { incrementUnread: message.senderRole === "admin" });
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
    await fetch(`/api/chat/tickets/${ticketId}/read`, { method: "POST" }).catch(() => null);
    readInFlightRef.current.delete(ticketId);
    window.dispatchEvent(new Event("moonstrike:customer-messages-read"));
  }

  async function loadMessages(ticketId: string) {
    setSelectedId(ticketId);
    if (isDraftTicketId(ticketId)) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }
    void markTicketRead(ticketId, { force: true });
    setIsLoadingMessages(true);
    setError("");

    try {
      const response = await fetch(`/api/chat/tickets/${ticketId}/messages`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load messages.");
        return;
      }

      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setHasMoreMessages(Boolean(payload.hasMore));
      scrollMessagesToBottom();
    } catch {
      setError("Unable to reach chat.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function refreshTickets(options: { force?: boolean } = {}) {
    const { force = false } = options;
    if (!force && document.visibilityState !== "visible") return;

    try {
      const response = await fetch("/api/chat/tickets", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (response.ok && Array.isArray(payload.tickets)) {
        const nextTickets = payload.tickets as ChatTicket[];
        setTickets((current) => {
          const draftTickets = current.filter((ticket) => isDraftTicketId(ticket.id));
          return [...draftTickets, ...nextTickets];
        });
      }
    } catch {
      // Background refresh should stay quiet.
    }
  }

  async function refreshLatestMessages(options: { force?: boolean } = {}) {
    const { force = false } = options;
    if (!selectedId) return;
    if (isDraftTicketId(selectedId)) return;
    if (!force && document.visibilityState !== "visible") return;

    try {
      const response = await fetch(`/api/chat/tickets/${selectedId}/messages?limit=10`, { cache: "no-store" });
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
      // Background refresh should stay quiet.
    }
  }

  async function getOrCreateSelectedTicket() {
    if (selectedId && !isDraftTicketId(selectedId)) return selectedId;
    if (createTicketPromiseRef.current) return createTicketPromiseRef.current;

    createTicketPromiseRef.current = (async () => {
      const draftOrderRef = selectedId && selectedId.startsWith("draft:order:") ? selectedId.slice("draft:order:".length) : null;
      const response = await fetch("/api/chat/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftOrderRef ? { orderRef: draftOrderRef } : {}),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ticket?.id) {
        throw new Error(payload.error ?? "Unable to start chat.");
      }

      const ticket = payload.ticket as ChatTicket;
      setTickets((current) => {
        const withoutDraft = draftOrderRef ? current.filter((item) => item.id !== `draft:order:${draftOrderRef}`) : current.filter((item) => item.id !== "draft:support");
        return withoutDraft.some((item) => item.id === ticket.id) ? withoutDraft : [ticket, ...withoutDraft];
      });
      setSelectedId(ticket.id);
      void markTicketRead(ticket.id);
      return ticket.id;
    })();

    try {
      return await createTicketPromiseRef.current;
    } finally {
      createTicketPromiseRef.current = null;
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
      const response = await fetch(`/api/chat/tickets/${selectedId}/messages?${params.toString()}`, { cache: "no-store" });
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
      setError("Unable to reach chat.");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  function handleMessageScroll(event: UIEvent<HTMLDivElement>) {
    if (event.currentTarget.scrollTop <= 24) {
      void loadOlderMessages();
    }

    if (selectedId && isNearMessageBottom()) {
      if (isUserScrollEvent(event)) void markTicketRead(selectedId, { force: true });
    }
  }

  function openSupportChat() {
    const existing = tickets.find((ticket) => !ticket.orderRef && !isDraftTicketId(ticket.id));
    if (existing) {
      setCreateChatOpen(false);
      setCreateChatError("");
      void loadMessages(existing.id);
      return;
    }

    const draft = draftSupportTicket();
    setTickets((current) => (current.some((ticket) => ticket.id === draft.id) ? current : [draft, ...current]));
    setSelectedId(draft.id);
    setMessages([]);
    setHasMoreMessages(false);
    setCreateChatOpen(false);
    setCreateChatError("");
  }

  function openOrderChat(orderRef: string) {
    if (!orderRef) {
      setCreateChatError("Choose an order first.");
      return;
    }
    const existing = tickets.find((ticket) => ticket.orderRef === orderRef && !isDraftTicketId(ticket.id));
    if (existing) {
      setCreateChatOpen(false);
      setCreateChatError("");
      void loadMessages(existing.id);
      return;
    }

    const draft = { ...draftOrderTicket(orderRef), id: `draft:order:${orderRef}` };
    setTickets((current) => (current.some((ticket) => ticket.id === draft.id) ? current : [draft, ...current]));
    setSelectedId(draft.id);
    setMessages([]);
    setHasMoreMessages(false);
    setCreateChatOpen(false);
    setCreateChatError("");
  }

  function markSelectedTicketReadByActivity() {
    if (!selectedId || isDraftTicketId(selectedId)) return;
    void markTicketRead(selectedId, { force: true });
  }

  async function sendMessage() {
    if (!draft.trim() && attachments.length === 0) return;

    setIsSending(true);
    setError("");
    setSendFailedMessage("");
    let uploadedImages: Awaited<ReturnType<typeof uploadChatComposerAttachments>>["uploadedImages"] = [];

    try {
      const ticketId = await getOrCreateSelectedTicket();
      const resolved = await uploadChatComposerAttachments(attachments);
      uploadedImages = resolved.uploadedImages;
      const response = await fetch(`/api/chat/tickets/${ticketId}/messages`, {
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
      void refreshTickets();
      notifyChatUpdated();
    } catch (sendError) {
      await Promise.all(uploadedImages.map(deleteChatImageAttachment));
      setSendFailedMessage(sendError instanceof Error ? sendError.message : "Unable to reach chat.");
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshTickets();
    }, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId || isDraftTicketId(selectedId)) return;

    const intervalId = window.setInterval(() => {
      void refreshLatestMessages();
    }, 1_500);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    function refreshVisibleChat() {
      if (document.visibilityState !== "visible") return;
      void refreshTickets({ force: true });
      void refreshLatestMessages({ force: true });
    }

    window.addEventListener("focus", refreshVisibleChat);
    document.addEventListener("visibilitychange", refreshVisibleChat);

    return () => {
      window.removeEventListener("focus", refreshVisibleChat);
      document.removeEventListener("visibilitychange", refreshVisibleChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    return subscribeToChatUpdates(() => {
      void refreshTickets({ force: true });
      void refreshLatestMessages({ force: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="mt-6 grid h-[calc(100vh-190px)] min-h-[720px] gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="ms-card flex min-h-0 flex-col overflow-hidden rounded-xl">
        <div className="border-b border-[var(--ms-border)] p-4">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]">Conversations</p>
          <button
            type="button"
            onClick={() => setCreateChatOpen(true)}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--ms-border)] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
          >
            <MessageSquarePlus size={15} />
            Create Chat
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ms-body)]">No conversations yet.</p>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => {
                  if (ticket.id === selectedId) {
                    void markTicketRead(ticket.id, { force: true });
                  } else {
                    void loadMessages(ticket.id);
                  }
                }}
                className={`w-full border-b border-[var(--ms-border)] p-4 text-left transition-colors hover:bg-[var(--ms-hover-bg)] ${
                  selectedId === ticket.id ? "bg-[var(--ms-hover-bg)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{ticketLabel(ticket)}</span>
                  {ticket.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1.5 text-[10px] font-black leading-none text-white">
                      {ticket.unreadCount > 9 ? "9+" : ticket.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-sm text-[var(--ms-body)]">
                  {ticket.latestMessage || ticket.subject}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="ms-card flex min-h-0 flex-col overflow-hidden rounded-xl">
        <header className="border-b border-[var(--ms-border)] p-5">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]">
            {selectedTicket ? ticketLabel(selectedTicket) : "Support"}
          </p>
          <h2 className="mt-2 text-2xl font-black">{selectedTicket?.subject ?? "Customer chat"}</h2>
        </header>

        {error ? (
          <p className="mx-5 mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <div
          ref={messagePaneRef}
          onClick={markSelectedTicketReadByActivity}
          onScroll={handleMessageScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
        >
          {isLoadingMessages ? (
            <div className="space-y-3">
              <div className="h-16 w-2/3 animate-pulse rounded-xl bg-white/10" />
              <div className="ml-auto h-16 w-2/3 animate-pulse rounded-xl bg-white/10" />
              <div className="h-16 w-1/2 animate-pulse rounded-xl bg-white/10" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center text-center">
              <div>
                <h3 className="text-xl font-black">Start the conversation</h3>
                <p className="mt-2 text-sm text-[var(--ms-body)]">Send your question and support will reply from the admin inbox.</p>
              </div>
            </div>
          ) : (
            <>
              {isLoadingOlder ? (
                <div className="mx-auto h-8 w-40 animate-pulse rounded-md bg-white/10" />
              ) : hasMoreMessages ? (
                <p className="text-center text-xs text-[var(--ms-body)]">Scroll up to load older messages</p>
              ) : null}
              {messages.map((message) => {
                const mine = message.senderRole === "customer";
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6 ${
                        mine
                          ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                          : "border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] text-[var(--ms-body)]"
                      }`}
                    >
                      {message.content ? <p>{message.content}</p> : null}
                      <ChatAttachments attachments={message.attachments} />
                      <p className="mono mt-2 text-right text-[10px] opacity-70">{formatTime(message.sentAt)}</p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="border-t border-[var(--ms-border)] p-5">
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
          <div className="mt-3 flex gap-3">
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
              rows={2}
              className="min-h-12 flex-1 resize-none rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 py-3 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending || (!draft.trim() && attachments.length === 0)}
              className="ms-button flex h-12 items-center gap-2 self-end px-5 mono text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>

      {createChatOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4">
          <section className="ms-card w-full max-w-lg rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]">Create Chat</p>
                <h2 className="mt-2 text-2xl font-black">Open a conversation</h2>
                <p className="mt-1 text-sm text-[var(--ms-body)]">Existing chats will be opened instead of duplicated.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateChatOpen(false);
                  setCreateChatError("");
                }}
                className="admin-action-icon"
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
                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ms-body)]" htmlFor="profile-create-chat-type">
                  Chat type
                  <select
                    id="profile-create-chat-type"
                    value={createChatType}
                    onChange={(event) => {
                      setCreateChatType(event.target.value as CreateChatType);
                      setCreateSearch("");
                      setCreateChatError("");
                    }}
                    className="h-11 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 text-sm normal-case tracking-normal text-[var(--ms-heading)] outline-none focus:border-[var(--ms-gradient-end)]"
                  >
                    <option value="support">Support</option>
                    <option value="order">Order</option>
                  </select>
                </label>

                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ms-body)]" htmlFor="profile-create-chat-search">
                  Search
                  <input
                    id="profile-create-chat-search"
                    value={createSearch}
                    onChange={(event) => setCreateSearch(event.target.value)}
                    disabled={createChatType === "support"}
                    placeholder={createChatType === "order" ? "Search your order ref or service..." : "General Support"}
                    className="h-11 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 text-sm normal-case tracking-normal text-[var(--ms-heading)] outline-none focus:border-[var(--ms-gradient-end)] disabled:opacity-70"
                  />
                </label>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--ms-border)] bg-[var(--ms-field)]">
                {createCandidates.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--ms-body)]">No matching {createChatType === "order" ? "orders" : "chat options"} found.</p>
                ) : (
                  createCandidates.map((candidate) => (
                    <button
                      key={`${candidate.type}:${candidate.value}`}
                      type="button"
                      onClick={() => {
                        if (candidate.type === "order") {
                          openOrderChat(candidate.value);
                        } else {
                          openSupportChat();
                        }
                      }}
                      className="w-full border-b border-[var(--ms-border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--ms-hover-bg)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold text-[var(--ms-heading)]">{candidate.label}</span>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ms-gradient-end)]">{candidate.type}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--ms-body)]">{candidate.detail}</p>
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
