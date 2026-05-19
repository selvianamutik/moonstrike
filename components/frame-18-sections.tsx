import Image from "next/image";
import { PlaceholderAsset } from "@/components/asset-image";

const benefits = [
  ["benefits 1", "deskripsi"],
  ["benefits 2", "deskripsi"],
  ["benefits 3", "deskripsi"],
];

const steps = [
  ["1. Choose Your Service", "Pick the service you need - leveling, gear, raids, or anything else. Customize options to fit your goals."],
  ["2. We Log Into Your Account", "Share your account credentials securely. Our professional boosters get to work immediately after verification."],
  ["3. Receive Daily Progress Updates", "Stay in the loop with real-time progress reports. Chat with your booster directly via our support system."],
  ["4. Enjoy the Result", "Service done. Log back in and dominate. Your character is ready - fully leveled, geared, and unstoppable."],
];

export function Frame18Sections() {
  return (
    <section className="ms-shell mt-24 text-white">
      <h2 className="text-center text-4xl font-black tracking-[-0.05em]">
        Why <span className="section-accent">Choose Us</span>?
      </h2>

      <PlaceholderAsset
        alt="Moon Strike benefits preview"
        className="mx-auto mt-8 h-72 max-w-5xl rounded-xl border border-[#807dff]"
        priority
      />

      <div className="mx-auto mt-6 grid max-w-6xl gap-8 md:grid-cols-3 md:gap-0">
        {benefits.map(([title, body], index) => (
          <article
            key={title}
            className={`flex items-center gap-5 px-8 py-7 ${index > 0 ? "md:border-l md:border-[#38366e]" : ""}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-[#8f93b8] mono text-lg font-bold text-[#8f93b8]">
              $
            </span>
            <div>
              <h3 className="mono text-2xl font-bold text-[#a8abc7]">{title}</h3>
              <p className="mono text-sm text-[#777ba8]">{body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-24 text-center">
        <h2 className="text-4xl font-black tracking-[-0.05em]">
          Up & Running in <span className="section-accent">4 Simple steps</span>
        </h2>
        <p className="mono mt-2 text-sm text-[#a8abc7]">Deskripsi</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 overflow-hidden rounded-xl border border-[var(--border)] md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article
            key={title}
            className={`relative min-h-56 overflow-hidden bg-[var(--panel-strong)] p-8 ${index === 0 ? "md:rounded-tl-xl" : ""} ${index === 1 ? "md:rounded-tr-xl" : ""} ${index === 2 ? "md:rounded-bl-xl" : ""} ${index === 3 ? "md:rounded-br-xl text-right" : ""}`}
          >
            <div
              className={`absolute h-72 w-72 rounded-full bg-[var(--primary)] shadow-[0_0_22px_rgba(136,82,255,0.55)] ${
                index === 0
                  ? "-bottom-24 -right-24"
                  : index === 1
                    ? "-top-52 left-8"
                    : index === 2
                      ? "-bottom-56 left-2"
                      : "-bottom-28 -left-28"
              }`}
            />
            <div className={`relative z-10 ${index === 3 ? "ml-auto max-w-52" : "max-w-64"}`}>
              <h3 className="font-black text-[#a8abc7]">{title}</h3>
              <p className="mt-3 leading-6 text-[#777ba8]">{body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20 text-center">
        <h2 className="text-4xl font-black tracking-[-0.05em]">
          Rating <span className="section-accent">TrustPilot</span>
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-[60px_repeat(4,1fr)_60px]">
          <button className="hidden rounded-md border border-[var(--border)] bg-[var(--panel-strong)] text-4xl text-[#8f93b8] md:block">
            ‹
          </button>
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className="rounded-md border border-[var(--border)] bg-[var(--panel-strong)] p-5 text-left">
              <h3 className="mono text-xl text-[#a8abc7]">Nama user</h3>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Image key={starIndex} src="/assets/star.png" alt="" width={18} height={18} />
                ))}
              </div>
              <p className="mono mt-2 text-xs text-[#777ba8]">Komentar</p>
            </article>
          ))}
          <button className="hidden rounded-md border border-[var(--border)] bg-[var(--panel-strong)] text-4xl text-[#8f93b8] md:block">
            ›
          </button>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-center gap-10">
        {[
          ["/payment/paypal.svg", "PayPal"],
          ["/payment/master-card.svg", "Mastercard"],
          ["/payment/apple-pay.svg", "Apple Pay"],
          ["/payment/google-pay.svg", "Google Pay"],
          ["/payment/stripe.svg", "Stripe"],
        ].map(([src, alt]) => (
          <Image key={src} src={src} alt={alt} width={150} height={46} className="h-10 w-auto opacity-90" />
        ))}
      </div>
    </section>
  );
}
