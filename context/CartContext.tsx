'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { calculateConfiguredPrice } from '@/lib/catalog';

type CartItemWithService = {
  id: string;
  serviceSlug: string;
  quantity: number;
  region: string;
  selectedOptions: Array<{
    group: string;
    value: string;
    priceModifier: number;
  }>;
  service: {
    name: string;
    offerTitle?: string;
    startingPrice: number;
  };
  lineTotal: number;
};

type CartState = {
  items: CartItemWithService[];
};

type CartAction =
  | { type: 'SET_ITEMS'; payload: CartItemWithService[] }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
};

function calculateLineTotal(
  service: CartItemWithService['service'],
  selectedOptions: CartItemWithService['selectedOptions'],
  quantity: number
) {
  return calculateConfiguredPrice(service.startingPrice, selectedOptions) * quantity;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity < 1) return state;

      const updatedItems = state.items.map((item) => {
        if (item.id === id) {
          const newLineTotal = calculateLineTotal(item.service, item.selectedOptions, quantity);
          return { ...item, quantity, lineTotal: newLineTotal };
        }
        return item;
      });

      return { ...state, items: updatedItems };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

type CartContextType = {
  items: CartItemWithService[];
  subtotal: number;
  itemCount: number;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  announceChange: (message: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
  initialItems: CartItemWithService[];
};

export function CartProvider({ children, initialItems }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, { items: initialItems });

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const announceChange = useCallback((message: string) => {
    const liveRegion = document.getElementById('cart-announcer');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, []);

  const subtotal = state.items.reduce((total, item) => total + item.lineTotal, 0);
  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        subtotal,
        itemCount,
        updateQuantity,
        removeItem,
        clearCart,
        announceChange,
      }}
    >
      {children}
      <div
        id="cart-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export type { CartItemWithService };
