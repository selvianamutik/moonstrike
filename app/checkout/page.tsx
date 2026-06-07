import { CartProvider } from '@/context/CartContext';
import { CheckoutPageClient } from './CheckoutPageClient';
import { getCartLines } from '@/lib/catalog';

export default function CheckoutPage() {
  const cartLines = getCartLines();

  return (
    <CartProvider initialItems={cartLines}>
      <CheckoutPageClient />
    </CartProvider>
  );
}
