"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function MessageTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  useEffect(() => {
    router.replace(`/admin/messages?ticket=${ticketId}`);
  }, [router, ticketId]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-[#94A3B8] text-sm">
      Loading conversation...
    </div>
  );
}
