"use client";

import { useEffect } from "react";

/**
 * Clears applied vouchers from sessionStorage once an order is confirmed,
 * so redeemed single-use codes are not re-applied to a new cart.
 */
export function ClearAppliedVouchers() {
  useEffect(() => {
    sessionStorage.removeItem("appliedVouchers");
  }, []);

  return null;
}