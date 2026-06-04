import { CheckoutPageClient } from "@/components/checkout-page-client";
import { requireVerifiedUser } from "@/lib/auth/session";

export default async function CheckoutPage() {
  await requireVerifiedUser("/checkout");

  return <CheckoutPageClient />;
}
