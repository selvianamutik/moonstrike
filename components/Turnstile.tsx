"use client";

import { Turnstile as TurnstileWidget, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export function Turnstile({ onSuccess, onError, onExpire, theme = "auto" }: TurnstileProps) {
  const ref = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
    return null;
  }

  return (
    <TurnstileWidget
      ref={ref}
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme,
        size: "normal",
      }}
    />
  );
}
