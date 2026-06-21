"use client";

export const CHAT_UPDATED_EVENT = "moonstrike:chat-updated";
const CHAT_UPDATED_STORAGE_KEY = "moonstrike:chat-updated-at";

export function notifyChatUpdated() {
  window.dispatchEvent(new Event(CHAT_UPDATED_EVENT));

  try {
    window.localStorage.setItem(CHAT_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

export function subscribeToChatUpdates(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CHAT_UPDATED_STORAGE_KEY) callback();
  }

  window.addEventListener(CHAT_UPDATED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHAT_UPDATED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
