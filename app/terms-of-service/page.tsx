import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: [
      "By accessing or using Moon Strike, you agree to be bound by these Terms of Service.",
      "If you do not agree with these terms, do not use the storefront, checkout, support, or account services.",
    ],
  },
  {
    id: "conduct",
    title: "User Conduct",
    body: [
      "You agree to provide accurate order information and avoid abusive, fraudulent, or disruptive behavior.",
      "You may not use Moon Strike to harass staff, submit false claims, abuse payment systems, or interfere with service delivery.",
    ],
  },
  {
    id: "delivery",
    title: "Service Delivery",
    body: [
      "Moon Strike aims to deliver services within the estimates shown at checkout or communicated by support.",
      "Delivery timing may change because of queue availability, game maintenance, account access issues, or customer-requested changes.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: [
      "Moon Strike is not liable for indirect, incidental, special, consequential, or punitive damages.",
      "Customers accept the ordinary risks associated with third-party games, platform changes, and account-specific requirements.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    body: [
      "Moon Strike may suspend or terminate access for policy abuse, fraudulent activity, chargeback abuse, or threats to staff.",
      "Termination does not remove obligations tied to completed purchases, active disputes, or payment provider investigations.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-20">
        <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Legal / Storefront</p>
        <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.04em]">Terms of Service</h1>
        <p className="mt-5 text-[var(--ms-body)]">Last Updated: October 26, 2024</p>

        <div className="mt-10 border-t border-[var(--ms-border)] pt-12 lg:grid lg:grid-cols-[270px_1fr] lg:gap-8">
          <aside className="ms-card h-fit rounded-lg p-6 mono text-xs text-[var(--ms-body)] lg:sticky lg:top-32">
            <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--ms-heading)]">Contents</h2>
            <nav className="mt-6 space-y-5">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`block hover:text-[var(--ms-gradient-end)] ${
                    index === 0 ? "text-[var(--ms-gradient-end)]" : ""
                  }`}
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="mt-10 space-y-12 lg:mt-0">
            {sections.map((section, index) => (
              <LegalSection key={section.id} id={section.id} title={`${index + 1}. ${section.title}`}>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-5 first:mt-0">
                    {paragraph}
                  </p>
                ))}
              </LegalSection>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="font-display text-3xl font-black">{title}</h2>
      <div className="ms-card mt-7 rounded-lg p-8 leading-8 text-[var(--ms-body)]">{children}</div>
    </section>
  );
}
