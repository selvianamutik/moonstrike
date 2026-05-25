"use client";

import { usePathname } from "next/navigation";

const messages = [
  {
    author: "Moon Strike Support",
    body: "Need help choosing a boost? Send your game, region, and target goal.",
    side: "left",
    time: "Now",
  },
  {
    author: "Guest",
    body: "Can I ask about delivery before checkout?",
    side: "right",
    time: "Now",
  },
  {
    author: "Moon Strike Support",
    body: "Yes. We can confirm requirements and timing before you place the order.",
    side: "left",
    time: "Now",
  },
];

export function GlobalChatBubble() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 text-[var(--ms-heading)] sm:bottom-7 sm:right-7">
      <input id="global-chat-toggle" type="checkbox" className="peer sr-only" />

      <label
        htmlFor="global-chat-toggle"
        role="button"
        aria-label="Open support chat"
        className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] font-display text-xl font-black shadow-[0_16px_45px_rgba(0,0,0,0.45),0_0_22px_rgba(34,211,238,0.35)] hover:bg-[var(--ms-hover-bg)] peer-checked:hidden"
      >
        MS
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 mono text-[10px] text-white">
          2
        </span>
      </label>

      <section
        aria-label="Support chat"
        className="hidden h-[480px] w-[calc(100vw-2.5rem)] max-w-[320px] flex-col overflow-hidden rounded-xl border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] shadow-[0_24px_90px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.2)] peer-checked:flex"
      >
        <header className="flex items-center justify-between border-b border-[var(--ms-border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-black">Moon Strike Support</h2>
            <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ms-success)]">
              Online / storefront
            </p>
          </div>
          <label
            htmlFor="global-chat-toggle"
            role="button"
            aria-label="Close support chat"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
          >
            X
          </label>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={`${message.author}-${message.body}`} className={message.side === "right" ? "text-right" : ""}>
              <p className="mono mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--ms-body)]">
                {message.author} / {message.time}
              </p>
              <div
                className={`inline-block max-w-[85%] rounded-lg px-4 py-3 text-left text-sm leading-6 ${
                  message.side === "right"
                    ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                    : "border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] text-[var(--ms-body)]"
                }`}
              >
                {message.body}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--ms-border)] p-3">
          <label htmlFor="global-chat-message" className="sr-only">
            Message support
          </label>
          <div className="flex gap-2">
            <input
              id="global-chat-message"
              type="text"
              placeholder="Type a message..."
              className="h-11 min-w-0 flex-1 rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
            />
            <button
              type="button"
              className="ms-button h-11 px-4 mono text-xs uppercase tracking-[0.14em]"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
