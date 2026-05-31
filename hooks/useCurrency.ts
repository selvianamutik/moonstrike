"use client";

import { useEffect, useState } from "react";

export type Currency = "USD" | "EUR";

const STORAGE_KEY = "ms_currency";

function readCurrency(value: string | null): Currency {
  return value === "EUR" ? "EUR" : "USD";
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    setCurrencyState(readCurrency(window.localStorage.getItem(STORAGE_KEY)));

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setCurrencyState(readCurrency(event.newValue));
      }
    };
    const onCurrencyChange = (event: Event) => {
      setCurrencyState(readCurrency((event as CustomEvent<Currency>).detail));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("moonstrike:currency", onCurrencyChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("moonstrike:currency", onCurrencyChange);
    };
  }, []);

  function setCurrency(next: Currency) {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("moonstrike:currency", { detail: next }));
  }

  function toggleCurrency() {
    setCurrency(currency === "USD" ? "EUR" : "USD");
  }

  return { currency, setCurrency, toggleCurrency };
}
