"use client";

export const CART_UPDATED_EVENT = "moonstrike:cart-updated";
const CART_UPDATED_STORAGE_KEY = "moonstrike:cart-updated-at";

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));

  try {
    window.localStorage.setItem(CART_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

export function subscribeToCartUpdates(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CART_UPDATED_STORAGE_KEY) callback();
  }

  window.addEventListener(CART_UPDATED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
