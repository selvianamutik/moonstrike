import { CartProvider } from '@/context/CartContext';
import { CartPageClient } from './CartPageClient';
import { getCartLines } from '@/lib/catalog';

export default function CartPage() {
  const cartLines = getCartLines();

  return (
    <CartProvider initialItems={cartLines}>
      <CartPageClient />
    </CartProvider>
  );
}
