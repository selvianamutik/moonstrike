import Image from "next/image";
import { PlaceholderAsset } from "@/components/asset-image";
import { StarRating } from "@/components/ui";
import type { LandingBenefitsData } from "@/lib/cms/landing";

const steps = [
  ["1. Choose Your Service", "Pick the boost, coaching, raid, or item service that matches your goal."],
  ["2. Configure Options", "Select region, run size, delivery speed, and other service-specific options."],
  ["3. Track Progress", "Follow order updates and use support chat for questions or extra instructions."],
  ["4. Enjoy the Result", "Log back in after delivery and review the completed work."],
];

const reviews = [
  ["ArcNova", "Fast mythic run, clean communication, and the order status stayed clear the whole time."],
  ["Valkyr", "The configuration flow made pricing easy to understand before checkout."],
  ["Kestrel", "Support answered quickly and the booster finished earlier than expected."],
  ["IonRush", "Good experience for a ranked push. I knew exactly what was happening."],
];

export function Frame18Sections({ benefits }: { benefits: LandingBenefitsData }) {
  return (
    <section id="about" className="ms-shell mt-24 text-[var(--ms-heading)]">
      <h2 className="font-display text-center text-4xl font-black tracking-[-0.04em]">
        {benefits.title.replace(benefits.accent, "").trim()}{" "}
        <span className="section-accent">{benefits.accent}</span>?
      </h2>

      {benefits.imageUrl ? (
        <div className="relative mx-auto mt-8 h-72 max-w-5xl overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
          <img src={benefits.imageUrl} alt={benefits.imageAlt} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
        </div>
      ) : (
        <PlaceholderAsset
          alt={benefits.imageAlt}
          className="mx-auto mt-8 h-72 max-w-5xl rounded-xl border border-[var(--ms-border)]"
          priority
        />
      )}

      <div className="mx-auto mt-6 grid max-w-6xl gap-6 md:grid-cols-3">
        {benefits.items.map((item) => (
          <article key={item.title} className="ms-card ms-card-hover rounded-lg p-7">
            <span className="mono flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ms-gradient-end)] text-lg font-bold text-[var(--ms-gradient-end)]">
              {item.icon}
            </span>
            <h3 className="mt-5 text-xl font-bold text-[var(--ms-heading)]">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-24 text-center">
        <h2 className="font-display text-4xl font-black tracking-[-0.04em]">
          Up and Running in <span className="section-accent">4 Simple Steps</span>
        </h2>
        <p className="mt-3 text-[var(--ms-body)]">A short path from service choice to completed result.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 overflow-hidden rounded-xl border border-[var(--ms-border)] md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article key={title} className="relative min-h-56 overflow-hidden bg-[var(--ms-bg-card)] p-8">
            <div
              className={`absolute h-72 w-72 rounded-full bg-[var(--primary)] opacity-70 shadow-[0_0_22px_rgba(139,92,246,0.45)] ${
                index === 0
                  ? "-bottom-24 -right-24"
                  : index === 1
                    ? "-top-52 left-8"
                    : index === 2
                      ? "-bottom-56 left-2"
                      : "-bottom-28 -left-28"
              }`}
            />
            <div className={`relative z-10 ${index === 3 ? "ml-auto max-w-56 text-right" : "max-w-72"}`}>
              <h3 className="font-bold text-[var(--ms-heading)]">{title}</h3>
              <p className="mt-3 leading-6 text-[var(--ms-body)]">{body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20 text-center">
        <h2 className="font-display text-4xl font-black tracking-[-0.04em]">
          Rating <span className="section-accent">TrustPilot</span>
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-[60px_repeat(4,1fr)_60px]">
          <button className="hidden rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-3xl text-[var(--ms-body)] md:block">
            &lt;
          </button>
          {reviews.map(([username, comment]) => (
            <StarRating key={username} username={username} comment={comment} />
          ))}
          <button className="hidden rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-3xl text-[var(--ms-body)] md:block">
            &gt;
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
