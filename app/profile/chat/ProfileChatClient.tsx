"use client";

import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";
import { CornerUpLeft, Send, X } from "lucide-react";
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
  initialTicket: ChatTicket | null;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
};

function formatTime(value: string) {
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

// Truncate reply preview to a single line
function replyPreview(content: string | null) {
  if (!content) return "Attachment";
  return content.length > 80 ? content.slice(0, 80) + "…" : content;
}

export function ProfileChatClient({ initialTicket, initialMessages, initialHasMore }: ProfileChatClientProps) {
  const messagePaneRef = useRef<HTMLDivElement | null>(null);
  const readInFlightRef = useRef<Set<string>>(new Set());
  const lastReadPostAtRef = useRef<Map<string, number>>(new Map());
  const seenRealtimeMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);
  const createTicketPromiseRef = useRef<Promise<string> | null>(null);

  const [ticket, setTicket] = useState<ChatTicket | null>(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [hasMoreMessages, setHasMoreMessages] = useState(initialHasMore);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [sendFailedMessage, setSendFailedMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const unreadCount = ticket?.unreadCount ?? 0;
  useUnreadDocumentTitle(unreadCount, "Chat - MoonStrike");

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

  const appendMessage = useCallback((message: ChatMessage) => {
    if (seenRealtimeMessageIdsRef.current.has(message.id)) return;
    seenRealtimeMessageIdsRef.current.add(message.id);

    const shouldScroll = isNearMessageBottom();
    setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));

    if (message.senderRole === "admin") {
      setTicket((t) => t ? { ...t, latestMessage: message.content || "Attachment", latestMessageAt: message.sentAt, unreadCount: t.unreadCount + 1 } : t);
    }

    if (shouldScroll) scrollMessagesToBottom("smooth");
  }, []);

  async function markTicketRead(ticketId: string, { force = false }: { force?: boolean } = {}) {
    setTicket((t) => t ? { ...t, unreadCount: 0 } : t);

    const now = Date.now();
    const lastPostAt = lastReadPostAtRef.current.get(ticketId) ?? 0;
    const isThrottled = !force && now - lastPostAt < 2_000;
    if (isThrottled || readInFlightRef.current.has(ticketId)) return;

    lastReadPostAtRef.current.set(ticketId, now);
    readInFlightRef.current.add(ticketId);
    await fetch(`/api/chat/tickets/${ticketId}/read`, { method: "POST" }).catch(() => null);
    readInFlightRef.current.delete(ticketId);
    window.dispatchEvent(new Event("moonstrike:customer-messages-read"));
  }

  async function getOrCreateTicket(): Promise<string> {
    if (ticket && !ticket.id.startsWith("draft:")) return ticket.id;
    if (createTicketPromiseRef.current) return createTicketPromiseRef.current;

    createTicketPromiseRef.current = (async () => {
      const response = await fetch("/api/chat/tickets", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ticket?.id) throw new Error(payload.error ?? "Unable to start chat.");

      const newTicket = payload.ticket as ChatTicket;
      setTicket(newTicket);
      return newTicket.id;
    })();

    try {
      return await createTicketPromiseRef.current;
    } finally {
      createTicketPromiseRef.current = null;
    }
  }

  async function loadOlderMessages() {
    if (!ticket || !hasMoreMessages || isLoadingOlder || messages.length === 0) return;

    const pane = messagePaneRef.current;
    const previousHeight = pane?.scrollHeight ?? 0;
    const oldest = messages[0]?.sentAt;
    if (!oldest) return;

    setIsLoadingOlder(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "20", before: oldest });
      const response = await fetch(`/api/chat/tickets/${ticket.id}/messages?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load older messages.");
        return;
      }

      const older = Array.isArray(payload.messages) ? payload.messages : [];
      if (older.length === 0) { setHasMoreMessages(false); return; }

      setMessages((current) => {
        const existing = new Set(current.map((m) => m.id));
        return [...older.filter((m: ChatMessage) => !existing.has(m.id)), ...current];
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

  async function refreshLatestMessages(options: { force?: boolean } = {}) {
    const { force = false } = options;
    if (!ticket || ticket.id.startsWith("draft:")) return;
    if (!force && document.visibilityState !== "visible") return;

    try {
      const response = await fetch(`/api/chat/tickets/${ticket.id}/messages?limit=20`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return;

      const latest = Array.isArray(payload.messages) ? payload.messages : [];
      const shouldScroll = isNearMessageBottom();
      const existing = new Set(messagesRef.current.map((m) => m.id));
      const newMessages = latest.filter((m: ChatMessage) => !existing.has(m.id));
      newMessages.forEach((m: ChatMessage) => seenRealtimeMessageIdsRef.current.add(m.id));
      setMessages((current) => {
        const currentIds = new Set(current.map((m) => m.id));
        const filtered = newMessages.filter((m: ChatMessage) => !currentIds.has(m.id));
        return filtered.length > 0 ? [...current, ...filtered] : current;
      });
      if (newMessages.some((m: ChatMessage) => m.senderRole === "admin")) {
        setTicket((t) => t ? { ...t, unreadCount: t.unreadCount + newMessages.filter((m: ChatMessage) => m.senderRole === "admin").length } : t);
      }
      if (shouldScroll) scrollMessagesToBottom("smooth");
    } catch {
      // Background refresh should stay quiet.
    }
  }

  function handleMessageScroll(event: UIEvent<HTMLDivElement>) {
    if (event.currentTarget.scrollTop <= 24) void loadOlderMessages();
    if (ticket && !ticket.id.startsWith("draft:") && isNearMessageBottom()) {
      if (isUserScrollEvent(event)) void markTicketRead(ticket.id, { force: true });
    }
  }

  function markReadByActivity() {
    if (!ticket || ticket.id.startsWith("draft:")) return;
    void markTicketRead(ticket.id, { force: true });
  }

  async function sendMessage() {
    if (!draft.trim() && attachments.length === 0) return;

    setIsSending(true);
    setError("");
    setSendFailedMessage("");
    let uploadedImages: Awaited<ReturnType<typeof uploadChatComposerAttachments>>["uploadedImages"] = [];

    try {
      const ticketId = await getOrCreateTicket();
      const resolved = await uploadChatComposerAttachments(attachments);
      uploadedImages = resolved.uploadedImages;

      const response = await fetch(`/api/chat/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft,
          attachments: resolved.attachments,
          replyToId: replyingTo?.id ?? null,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSendFailedMessage(payload.error ?? "Unable to send message.");
        return;
      }

      setDraft("");
      setAttachments([]);
      setReplyingTo(null);
      appendMessage(payload.message);
      void markTicketRead(ticketId, { force: true });
      notifyChatUpdated();
    } catch (sendError) {
      await Promise.all(uploadedImages.map(deleteChatImageAttachment));
      setSendFailedMessage(sendError instanceof Error ? sendError.message : "Unable to reach chat.");
    } finally {
      setIsSending(false);
    }
  }

  // Poll for new messages
  useEffect(() => {
    if (!ticket || ticket.id.startsWith("draft:")) return;
    const intervalId = window.setInterval(() => void refreshLatestMessages(), 2_000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  // Refresh on focus/visibility
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      void refreshLatestMessages({ force: true });
    }
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  // Subscribe to realtime chat events
  useEffect(() => {
    return subscribeToChatUpdates(() => void refreshLatestMessages({ force: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  return (
    <div className="mt-6 flex h-[calc(100vh-190px)] min-h-[600px] flex-col overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--ms-border)] px-6 py-4">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]">Support Chat</p>
          <h2 className="mt-1 text-xl font-black text-[var(--ms-heading)]">
            {ticket ? ticket.customerName : "Support"}
          </h2>
        </div>
        {ticket && (
          <span className={`mono rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
            ticket.status === "resolved"
              ? "border-[var(--ms-border)] text-[var(--ms-body)]"
              : "border-[var(--ms-gradient-end)]/40 text-[var(--ms-gradient-end)]"
          }`}>
            {ticket.status}
          </span>
        )}
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</p>
      ) : null}

      {/* Messages */}
      <div
        ref={messagePaneRef}
        onClick={markReadByActivity}
        onScroll={handleMessageScroll}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
      >
        {isLoadingMessages ? (
          <div className="space-y-3">
            <div className="h-16 w-2/3 animate-pulse rounded-xl bg-[var(--ms-border)]" />
            <div className="ml-auto h-16 w-2/3 animate-pulse rounded-xl bg-[var(--ms-border)]" />
            <div className="h-16 w-1/2 animate-pulse rounded-xl bg-[var(--ms-border)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[320px] items-center justify-center text-center">
            <div>
              <h3 className="text-xl font-black text-[var(--ms-heading)]">Start the conversation</h3>
              <p className="mt-2 text-sm text-[var(--ms-body)]">Send your question and our support team will reply shortly.</p>
            </div>
          </div>
        ) : (
          <>
            {isLoadingOlder ? (
              <div className="mx-auto h-8 w-40 animate-pulse rounded-md bg-[var(--ms-border)]" />
            ) : hasMoreMessages ? (
              <p className="text-center text-xs text-[var(--ms-body)]">Scroll up to load older messages</p>
            ) : null}

            {messages.map((message) => {
              const mine = message.senderRole === "customer";
              // Read receipt: message is read if admin_last_read_at >= message.sentAt
              const isRead = mine && ticket?.adminLastReadAt
                ? message.sentAt <= ticket.adminLastReadAt
                : false;

              const replyBtn = (
                <button
                  type="button"
                  onClick={() => setReplyingTo(message)}
                  title="Reply"
                  aria-label="Reply to message"
                  className="mb-1 shrink-0 rounded-full p-1.5 text-[var(--ms-body)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-heading)]"
                >
                  <CornerUpLeft size={14} />
                </button>
              );

              return (
                <div key={message.id} className={`group flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                  {/* Reply button LEFT — for own messages (bubble is on the right) */}
                  {mine && replyBtn}

                  <div className="flex max-w-[82%] flex-col gap-1">
                    {/* Reply quote bubble */}
                    {message.replyToId && (
                      <div className="flex items-start gap-2 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-3 py-2 text-xs opacity-80">
                        <CornerUpLeft size={12} className="mt-0.5 shrink-0 text-[var(--ms-gradient-end)]" />
                        <span className="line-clamp-2 text-[var(--ms-body)]">
                          <span className="font-bold text-[var(--ms-heading)]">{message.replyToSenderRole === "admin" ? "Support" : "You"}: </span>
                          {replyPreview(message.replyToContent)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-6 ${
                        mine
                          ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                          : "chat-bubble-support"
                      }`}
                    >
                      {message.content ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
                      <ChatAttachments attachments={message.attachments} />

                      {/* Timestamp + read receipt */}
                      <div className={`mt-1.5 flex items-center gap-1 text-[10px] opacity-70 ${mine ? "justify-end" : "justify-start"}`}>
                        <span className="mono">{formatTime(message.sentAt)}</span>
                        {mine && (
                          isRead ? (
                            <span title="Seen" className="inline-flex text-[var(--ms-gradient-end)] opacity-100">
                              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                                <path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          ) : (
                            <span title="Sent" className="inline-flex opacity-60">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                <path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply button RIGHT — admin messages (bubble on left) */}
                  {!mine && replyBtn}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--ms-border)] p-5">
        {/* Reply preview bar */}
        {replyingTo && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-3 py-2">
            <CornerUpLeft size={14} className="shrink-0 text-[var(--ms-gradient-end)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ms-gradient-end)]">
                Replying to {replyingTo.senderRole === "admin" ? "Support" : "yourself"}
              </p>
              <p className="truncate text-xs text-[var(--ms-body)]">{replyPreview(replyingTo.content)}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="shrink-0 rounded-md p-1 text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Send failed */}
        {sendFailedMessage ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-200">
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

        <ChatComposerTools attachments={attachments} disabled={isSending} onAttachmentsChange={setAttachments} onError={setError} userId={ticket?.userId ?? undefined} />
        <div className="mt-3 flex gap-3">
          <textarea
            value={draft}
            onFocus={markReadByActivity}
            onChange={(event) => { setDraft(event.target.value); markReadByActivity(); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={2}
            className="min-h-12 flex-1 resize-none rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 py-3 text-sm outline-none"
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
    </div>
  );
}
