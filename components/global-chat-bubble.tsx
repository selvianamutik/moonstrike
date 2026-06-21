"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { ChatAttachments } from "@/components/chat/ChatAttachments";
import { notifyChatUpdated } from "@/lib/chat-events";
import type { ChatMessage, ChatTicket } from "@/lib/chat";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function GlobalChatBubble() {
  const pathname = usePathname();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const readInFlightRef = useRef<Set<string>>(new Set());
  const loadChatInFlightRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<ChatTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [sendFailedMessage, setSendFailedMessage] = useState("");

  const hidden =
    pathname === "/login" ||
    pathname.startsWith("/register") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile/chat");
  const activeTicketId = ticket?.id ?? "";

  async function markTicketRead(ticketId: string) {
    if (unreadCount <= 0 || readInFlightRef.current.has(ticketId)) return;

    setUnreadCount(0);
    readInFlightRef.current.add(ticketId);
    await fetch(`/api/chat/tickets/${ticketId}/read`, { method: "POST" }).catch(() => null);
    readInFlightRef.current.delete(ticketId);
    window.dispatchEvent(new Event("moonstrike:customer-messages-read"));
  }

  async function loadUnreadCount() {
    if (document.visibilityState !== "visible") return;

    const response = await fetch("/api/chat/tickets", { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { tickets?: ChatTicket[] } | null;

    if (response?.ok && Array.isArray(payload?.tickets)) {
      const supportUnreadCount = payload.tickets
        .filter((item) => !item.orderId)
        .reduce((total, item) => total + item.unreadCount, 0);
      setUnreadCount(supportUnreadCount);
    }
  }

  function syncUnreadFromMessages(ticketId: string) {
    if (isOpen) {
      void markTicketRead(ticketId);
      return;
    }

    void loadUnreadCount();
  }

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      const nextMessages = [...current, message];
      syncUnreadFromMessages(message.ticketId);
      return nextMessages;
    });
  }, [isOpen, messages]);

  async function loadChat() {
    if (loadChatInFlightRef.current) return;
    loadChatInFlightRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      const ticketResponse = await fetch("/api/chat/tickets", { cache: "no-store" });
      const ticketPayload = await ticketResponse.json().catch(() => ({}));

      if (!ticketResponse.ok) {
        setError(ticketPayload.error ?? "Unable to open chat.");
        return;
      }

      const tickets = Array.isArray(ticketPayload.tickets) ? ticketPayload.tickets as ChatTicket[] : [];
      const existingTicket = tickets.find((item) => !item.orderId) ?? null;
      setUnauthorized(false);
      setTicket(existingTicket);
      setMessages([]);
      setHasMoreMessages(false);
      void loadUnreadCount();

      if (!existingTicket?.id) return;

      const messagesResponse = await fetch(`/api/chat/tickets/${existingTicket.id}/messages`, { cache: "no-store" });
      const messagesPayload = await messagesResponse.json().catch(() => ({}));

      if (!messagesResponse.ok) {
        setError(messagesPayload.error ?? "Unable to load messages.");
        return;
      }

      const nextMessages = Array.isArray(messagesPayload.messages) ? messagesPayload.messages : [];
      setMessages(nextMessages);
      setHasMoreMessages(Boolean(messagesPayload.hasMore));
      syncUnreadFromMessages(existingTicket.id);
    } catch {
      setError("Unable to reach support chat.");
    } finally {
      loadChatInFlightRef.current = false;
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!draft.trim()) return;

    setIsSending(true);
    setError("");
    setSendFailedMessage("");

    try {
      let ticketId = ticket?.id ?? "";

      if (!ticketId) {
        const ticketResponse = await fetch("/api/chat/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const ticketPayload = await ticketResponse.json().catch(() => ({}));

        if (!ticketResponse.ok || !ticketPayload.ticket?.id) {
          setSendFailedMessage(ticketPayload.error ?? "Unable to start support chat.");
          return;
        }

        const createdTicket = ticketPayload.ticket as ChatTicket;
        ticketId = createdTicket.id;
        setTicket(createdTicket);
        notifyChatUpdated();
      }

      const response = await fetch(`/api/chat/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSendFailedMessage(payload.error ?? "Unable to send message.");
        return;
      }

      setDraft("");
      appendMessage(payload.message);
      void markTicketRead(ticketId);
      notifyChatUpdated();
    } catch {
      setSendFailedMessage("Unable to reach support chat.");
    } finally {
      setIsSending(false);
    }
  }

  async function refreshMessages() {
    if (!ticket?.id) return;
    if (document.visibilityState !== "visible") return;

    try {
      const response = await fetch(`/api/chat/tickets/${ticket.id}/messages`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        const latest = Array.isArray(payload.messages) ? payload.messages : [];
        setHasMoreMessages(Boolean(payload.hasMore));
        setMessages((current) => {
          const existing = new Set(current.map((message) => message.id));
          const nextMessages = latest.filter((message: ChatMessage) => !existing.has(message.id));
          const mergedMessages = nextMessages.length > 0 ? [...current, ...nextMessages] : current;
          syncUnreadFromMessages(ticket.id);
          return mergedMessages;
        });
      }
    } catch {
      // Background refresh should stay quiet.
    }
  }

  async function loadOlderMessages() {
    if (!ticket?.id || !hasMoreMessages || isLoadingOlder || messages.length === 0) return;

    const pane = messageListRef.current;
    const previousHeight = pane?.scrollHeight ?? 0;
    const oldest = messages[0]?.sentAt;
    if (!oldest) return;

    setIsLoadingOlder(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "10", before: oldest });
      const response = await fetch(`/api/chat/tickets/${ticket.id}/messages?${params.toString()}`, { cache: "no-store" });
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
      setError("Unable to reach support chat.");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  function isNearMessageBottom() {
    const pane = messageListRef.current;
    if (!pane) return true;
    return pane.scrollHeight - pane.scrollTop - pane.clientHeight < 120;
  }

  function markActiveTicketReadByActivity() {
    if (!ticket?.id) return;
    void markTicketRead(ticket.id);
  }

  useEffect(() => {
    if (isOpen && !ticket && !isLoading && !unauthorized) {
      loadChat();
    }
    if (isOpen && activeTicketId) void markTicketRead(activeTicketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicketId, isOpen]);

  useEffect(() => {
    if (hidden && isOpen) {
      setIsOpen(false);
    }
  }, [hidden, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (isLoadingOlder) return;
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isLoadingOlder, isOpen, messages]);

  useEffect(() => {
    if (hidden || !activeTicketId) return;

    const intervalId = window.setInterval(() => {
      if (!isOpen) return;
      void refreshMessages();
    }, 1_500);

    function refreshVisibleChat() {
      void refreshMessages();
      void loadUnreadCount();
    }

    window.addEventListener("focus", refreshVisibleChat);
    document.addEventListener("visibilitychange", refreshVisibleChat);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshVisibleChat);
      document.removeEventListener("visibilitychange", refreshVisibleChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicketId, hidden, isOpen]);

  useEffect(() => {
    if (hidden) return;

    void loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 5_000);
    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener("moonstrike:customer-messages-read", loadUnreadCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener("moonstrike:customer-messages-read", loadUnreadCount);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 text-[var(--ms-heading)] sm:bottom-7 sm:right-7">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open support chat"
          className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] font-display text-xl font-black shadow-[0_16px_45px_rgba(0,0,0,0.45),0_0_22px_rgba(34,211,238,0.35)] hover:bg-[var(--ms-hover-bg)]"
        >
          MS
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 mono text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      ) : (
        <section
          aria-label="Support chat"
          className="flex h-[480px] w-[calc(100vw-2.5rem)] max-w-[320px] flex-col overflow-hidden rounded-xl border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] shadow-[0_24px_90px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.2)]"
        >
          <header className="flex items-center justify-between border-b border-[var(--ms-border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-black">Moon Strike Support</h2>
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ms-success)]">
                Online / storefront
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
            >
              <X size={16} />
            </button>
          </header>

          <div
            ref={messageListRef}
            onClick={markActiveTicketReadByActivity}
            onScroll={(event) => {
              if (event.currentTarget.scrollTop <= 24) void loadOlderMessages();
              if (ticket?.id && isNearMessageBottom()) void markTicketRead(ticket.id);
            }}
            className="flex-1 space-y-4 overflow-y-auto p-4"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-16 w-3/4 animate-pulse rounded-lg bg-white/10" />
                <div className="ml-auto h-16 w-3/4 animate-pulse rounded-lg bg-white/10" />
                <div className="h-16 w-1/2 animate-pulse rounded-lg bg-white/10" />
              </div>
            ) : unauthorized ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <h3 className="text-lg font-black">Login to chat</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
                  Sign in to keep your support history connected to your account.
                </p>
                <Link href="/login?next=%2Fprofile%2Fchat" className="ms-button mt-5 h-11 px-5 mono text-xs uppercase tracking-[0.14em]">
                  Login
                </Link>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <h3 className="text-lg font-black">Need help?</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
                  Ask about services, order details, delivery timing, or refund questions.
                </p>
              </div>
            ) : (
              <>
                {isLoadingOlder ? (
                  <div className="mx-auto h-8 w-32 animate-pulse rounded-md bg-white/10" />
                ) : hasMoreMessages ? (
                  <p className="text-center text-[10px] text-[var(--ms-body)]">Scroll up for older messages</p>
                ) : null}

                {messages.map((message) => {
                  const mine = message.senderRole === "customer";
                  return (
                    <div key={message.id} className={mine ? "text-right" : ""}>
                      <p className="mono mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--ms-body)]">
                        {mine ? "You" : "Support"} / {formatTime(message.sentAt)}
                      </p>
                      <div
                        className={`inline-block max-w-[85%] rounded-lg px-4 py-3 text-left text-sm leading-6 ${
                          mine
                            ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                            : "border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] text-[var(--ms-body)]"
                        }`}
                      >
                        {message.content ? <p>{message.content}</p> : null}
                        <ChatAttachments attachments={message.attachments} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {error ? <p className="px-3 pb-2 text-xs text-red-300">{error}</p> : null}

          <div className="border-t border-[var(--ms-border)] p-3">
            {sendFailedMessage ? (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
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
            <label htmlFor="global-chat-message" className="sr-only">
              Message support
            </label>
            <div className="flex gap-2">
              <input
                id="global-chat-message"
                type="text"
                value={draft}
                onFocus={markActiveTicketReadByActivity}
                onChange={(event) => {
                  setDraft(event.target.value);
                  markActiveTicketReadByActivity();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={unauthorized || isSending}
                placeholder="Type a message..."
                className="h-11 min-w-0 flex-1 rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 text-sm outline-none focus:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={unauthorized || isSending || !draft.trim()}
                className="ms-button h-11 px-4 mono text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
