import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_8%,rgba(136,82,255,0.16),transparent_22rem),var(--background)] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-5xl font-black">Refund Policy</h1>
        <p className="mt-5 text-[var(--muted)]">Effective Date: October 24, 2024</p>
        <article className="mt-14 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-8 sm:p-12">
          <RefundBlock icon="⌁" title="1. Overview">
            <p>At Moon Strike, we prioritize a fair and transparent ecosystem for all gamers and service providers. This Refund Policy outlines the conditions under which refunds are granted.</p>
            <p className="mt-5">By engaging in transactions on our platform, you agree to the terms set forth in this policy.</p>
          </RefundBlock>
          <RefundBlock icon="♦" title="2. The Escrow Process">
            <p>To ensure security for both buyers and sellers, funds are held in a secure Escrow account upon initiation of a service.</p>
            <div className="mt-5 rounded-md border border-[var(--border)] bg-[#101124] p-6">
              <h3 className="text-lg text-white">Escrow Timelines:</h3>
              <ul className="mt-5 space-y-4">
                {["Funds are locked in Escrow immediately upon order placement.", "Upon service delivery, the buyer has 48 hours to review and approve the work.", "If approved, funds are released to the seller instantly."].map((item) => (
                  <li key={item} className="flex gap-3"><span className="text-[var(--primary)]">●</span>{item}</li>
                ))}
              </ul>
            </div>
          </RefundBlock>
          <RefundBlock icon="↻" title="3. Eligibility for Refunds">
            <p>Refunds are generally processed back to the original payment method. You may be eligible under the following circumstances:</p>
            {["Non-Delivery of Service", "Service Not as Described", "Mutual Cancellation"].map((item) => (
              <div key={item} className="mt-5 rounded-md bg-[#3a394f] p-5">
                <h3 className="text-lg text-white">{item}</h3>
                <p className="mt-2 text-sm">If the order meets this condition, a full or partial refund may be initiated after review.</p>
              </div>
            ))}
          </RefundBlock>
          <RefundBlock icon="☊" title="4. Dispute Resolution">
            <p>If an issue arises regarding a completed service, you must open a dispute within the 48-hour review period. Our moderation team will review evidence from both parties.</p>
            <p className="mt-5 border-l-2 border-[var(--primary)] bg-[#101124] p-5 italic">Note: Once funds have been released from Escrow, Moon Strike can no longer guarantee a refund.</p>
          </RefundBlock>
        </article>
        <div className="mt-12 rounded-lg bg-[#3a394f] p-8 text-center">
          <p>Have questions about a specific transaction?</p>
          <a className="mt-3 block text-[var(--accent)] underline">Contact Support</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function RefundBlock({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--border)] py-8 first:pt-0 last:border-0">
      <h2 className="text-2xl font-black"><span className="mr-3 text-[var(--accent)]">{icon}</span>{title}</h2>
      <div className="mt-5 text-[var(--muted)] leading-8">{children}</div>
    </section>
  );
}
