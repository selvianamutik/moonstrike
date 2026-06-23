import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <div className="container mx-auto px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-lg text-[var(--ms-body)]">
            Last Updated: June 24, 2026
          </p>

          <div className="mt-10 space-y-8 text-[var(--ms-body)]">
            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                1. Acceptance of Terms
              </h2>
              <p className="mt-3 leading-7">
                By accessing and using Moon Strike's services, you agree to be bound by these Terms & Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                2. Service Description
              </h2>
              <p className="mt-3 leading-7">
                Moon Strike provides game boosting and coaching services. We connect verified professional players 
                with customers seeking assistance in improving their gaming performance and achievements.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                3. Account Registration
              </h2>
              <p className="mt-3 leading-7">
                You must provide accurate, complete, and current information during registration. You are responsible 
                for maintaining the confidentiality of your account credentials and for all activities that occur 
                under your account.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                4. User Conduct
              </h2>
              <p className="mt-3 leading-7">
                You agree not to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
                <li>Use our services for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Attempt to circumvent any security measures</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Provide false or misleading information</li>
                <li>Share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                5. Payment Terms
              </h2>
              <p className="mt-3 leading-7">
                All payments are processed securely through our payment providers. Prices are listed in USD unless 
                otherwise specified. Refund policies are outlined separately and may vary by service type.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                6. Service Delivery
              </h2>
              <p className="mt-3 leading-7">
                We strive to deliver services within the estimated timeframe. However, completion times may vary 
                based on factors beyond our control. We will keep you informed of progress throughout the service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                7. Account Security
              </h2>
              <p className="mt-3 leading-7">
                While we take measures to protect your gaming account information during service delivery, you 
                acknowledge the inherent risks associated with sharing account credentials. We recommend enabling 
                all available security features on your gaming accounts.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                8. Intellectual Property
              </h2>
              <p className="mt-3 leading-7">
                All content, trademarks, and other intellectual property on our platform are owned by Moon Strike 
                or our licensors. You may not use, copy, or distribute any content without our express permission.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                9. Limitation of Liability
              </h2>
              <p className="mt-3 leading-7">
                Moon Strike shall not be liable for any indirect, incidental, special, consequential, or punitive 
                damages resulting from your use of our services. Our total liability shall not exceed the amount 
                paid for the specific service in question.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                10. Privacy Policy
              </h2>
              <p className="mt-3 leading-7">
                Your use of our services is also governed by our Privacy Policy. We collect and use personal 
                information as described in that policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                11. Termination
              </h2>
              <p className="mt-3 leading-7">
                We reserve the right to suspend or terminate your account at any time for violation of these terms 
                or for any other reason we deem necessary. Upon termination, your right to use our services will 
                immediately cease.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                12. Changes to Terms
              </h2>
              <p className="mt-3 leading-7">
                We may update these Terms & Conditions from time to time. We will notify you of significant changes 
                via email or through our platform. Your continued use of our services after such changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--ms-heading)]">
                13. Contact Information
              </h2>
              <p className="mt-3 leading-7">
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <p className="mt-3 leading-7">
                Email: support@moonstrike.gg
              </p>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
