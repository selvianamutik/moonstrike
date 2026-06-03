import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/\s+(\/\/|#).*$/, "").trim();
}

export function getStripeSecretKey() {
  const key = cleanEnvValue(process.env.STRIPE_SECRET_KEY);

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return key;
}

export function getStripeWebhookSecret() {
  const secret = cleanEnvValue(process.env.STRIPE_WEBHOOK_SECRET);

  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  return secret;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}
