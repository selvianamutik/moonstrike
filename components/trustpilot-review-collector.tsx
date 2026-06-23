"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement, forceReload?: boolean) => void;
    };
  }
}

export function TrustpilotReviewCollector() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (window.Trustpilot) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptReady || !widgetRef.current || !window.Trustpilot) return;
    window.Trustpilot.loadFromElement(widgetRef.current, true);
  }, [scriptReady]);

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div
        ref={widgetRef}
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="69ffd34ed1c835dddb4e1d71"
        data-style-height="52px"
        data-style-width="100%"
        data-token="8bdcb767-9b54-44cc-8ff9-a34d1b6cd99d"
      >
        <a href="https://www.trustpilot.com/review/pytagotech.com" target="_blank" rel="noopener noreferrer">
          Trustpilot
        </a>
      </div>
    </>
  );
}
