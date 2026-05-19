import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <SiteHeader />
      <section className="ms-shell py-20">
        <h1 className="text-4xl font-black">Terms of Service</h1>
        <p className="mt-5 text-[var(--muted)]">Last Updated: October 26, 2024</p>
        <div className="mt-10 border-t border-[var(--border)] pt-12 lg:grid lg:grid-cols-[270px_1fr] lg:gap-8">
          <aside className="h-fit rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-6 mono text-xs text-[var(--muted)]">
            {["1. Acceptance of Terms", "2. User Conduct", "3. Service Delivery", "4. Limitation of Liability", "5. Termination"].map((item, index) => (
              <p key={item} className={index === 0 ? "text-[var(--accent)]" : "mt-5"}>{item}</p>
            ))}
          </aside>
          <div className="mt-10 space-y-12 lg:mt-0">
            <LegalSection title="1. Acceptance of Terms">
              <p>By accessing or using the Moon Strike marketplace, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
              <p className="mt-5">These Terms constitute a legally binding agreement between you and Moon Strike regarding your use of our gaming progression and marketplace services.</p>
            </LegalSection>
            <LegalSection title="2. Service Delivery">
              <p>Moon Strike commits to delivering services within the estimated timeframes provided at checkout. Delays caused by external factors are exempt from penalty.</p>
              <div className="mt-5 border border-[var(--accent)]/40 bg-[var(--field)] p-4">
                <h3 className="font-black">♢ Delivery Guarantee</h3>
                <p className="mt-2 mono text-xs">In the event of a critical failure to deliver, users are entitled to a full refund or service credit, subject to review by support.</p>
              </div>
            </LegalSection>
            <LegalSection title="3. Limitation of Liability">
              <p className="mono text-xs uppercase text-[var(--danger-soft)]">In no event shall Moon Strike be liable for any indirect, incidental, special, consequential or punitive damages.</p>
              <p className="mt-5">While we employ rigorous security measures, users accept inherent risks associated with third-party account access required for certain service types.</p>
            </LegalSection>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl font-black">{title}</h2>
      <div className="mt-7 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-8 text-[var(--muted)] leading-8">
        {children}
      </div>
    </section>
  );
}
