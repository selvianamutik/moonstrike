import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const eligibilityItems = [
  {
    title: "Non-Delivery",
    body: "The service was not started or delivered within the confirmed delivery window after support review.",
  },
  {
    title: "Not as Described",
    body: "The completed service materially differs from the purchased scope, selected options, or agreed outcome.",
  },
  {
    title: "Mutual Cancellation",
    body: "Customer and support agree to cancel before the booster has completed the purchased service.",
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Legal / Storefront</p>
        <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.05em]">Refund Policy</h1>
        <p className="mt-5 text-[var(--ms-body)]">Effective Date: October 24, 2024</p>

        <article className="ms-card mt-14 rounded-xl p-8 sm:p-12">
          <RefundBlock marker="01" title="Overview">
            <p>
              Moon Strike reviews refund requests case by case. The goal is to keep orders fair for customers while
              protecting completed booster work.
            </p>
            <p className="mt-5">
              Refunds are processed to the original payment route whenever the payment provider supports it.
            </p>
          </RefundBlock>

          <RefundBlock marker="02" title="Escrow Process">
            <p>
              After payment clears, the order moves into delivery. Customers have a 48-hour review window after delivery
              to confirm completion or raise a dispute.
            </p>
            <div className="ms-card mt-5 rounded-md p-6">
              <h3 className="text-lg text-[var(--ms-heading)]">48-hour review window</h3>
              <ul className="mt-5 space-y-4">
                {[
                  "Order starts after payment confirmation.",
                  "Customer reviews delivery proof for up to 48 hours.",
                  "If no dispute is opened, the order may be treated as completed.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--ms-gradient-end)]">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </RefundBlock>

          <RefundBlock marker="03" title="Eligibility">
            <p>You may be eligible for a full or partial refund under these conditions:</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {eligibilityItems.map((item) => (
                <div key={item.title} className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] p-5">
                  <h3 className="text-lg text-[var(--ms-heading)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6">{item.body}</p>
                </div>
              ))}
            </div>
          </RefundBlock>

          <RefundBlock marker="04" title="Dispute Resolution">
            <p>
              If a delivery issue occurs, open a dispute within the review window. Support may request screenshots,
              timestamps, chat history, or account status details before approving or denying a refund.
            </p>
          </RefundBlock>

          <RefundBlock marker="05" title="Important Note">
            <p className="border-l-2 border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] p-5 italic">
              Completed orders, account penalties caused by customer behavior, or changes requested after delivery may
              not qualify for a refund.
            </p>
          </RefundBlock>
        </article>

        <div className="ms-card mt-12 rounded-lg p-8 text-center">
          <h2 className="text-xl font-black">Need help with a specific transaction?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
            Contact support with your order ID and a short description of the issue.
          </p>
          <button type="button" className="ms-button mt-6 h-12 px-6 mono text-sm uppercase tracking-[0.16em]">
            Contact Support
          </button>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function RefundBlock({ marker, title, children }: { marker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--ms-border)] py-8 first:pt-0 last:border-0">
      <h2 className="text-2xl font-black">
        <span className="mono mr-3 text-[var(--ms-gradient-end)]">{marker}</span>
        {title}
      </h2>
      <div className="mt-5 leading-8 text-[var(--ms-body)]">{children}</div>
    </section>
  );
}
