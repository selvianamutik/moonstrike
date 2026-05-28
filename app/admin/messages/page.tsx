import React, { Suspense } from "react";
import MessagesPage from "./MessagesPageClient";

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={<div className="text-[#94A3B8] p-8">Loading messages...</div>}>
      <MessagesPage />
    </Suspense>
  );
}
