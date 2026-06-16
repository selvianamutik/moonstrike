import React from "react";

export type StatusType =
  | "Paid"
  | "paid"
  | "Pending"
  | "PENDING"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "delivered"
  | "refund_requested"
  | "Refunded"
  | "REFUNDED"
  | "refunded"
  | "Active"
  | "active"
  | "Success"
  | "SUCCESS"
  | "success"
  | "Scheduled"
  | "scheduled"
  | "Draft"
  | "draft"
  | "Critical"
  | "CRITICAL"
  | "critical"
  | "BLOCKED"
  | "blocked"
  | "Disputed"
  | "DISPUTED"
  | "disputed"
  | "Archived"
  | "archived"
  | "Banned"
  | "banned"
  | "failed"
  | "ACTIVE"
  | "SCHEDULED"
  | "DRAFT"
  | "completed"
  | "open"
  | "resolved";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let styleClasses = "";

  switch (status) {
    case "Paid":
    case "paid":
    case "Active":
    case "ACTIVE":
    case "active":
    case "Success":
    case "SUCCESS":
    case "success":
    case "completed":
      styleClasses = "bg-green-500/10 text-green-500 border-green-500/20";
      break;
    case "Pending":
    case "PENDING":
    case "pending":
    case "open":
    case "confirmed":
    case "Scheduled":
    case "SCHEDULED":
    case "scheduled":
    case "in_progress":
      styleClasses = "bg-amber-500/10 text-amber-500 border-amber-500/20";
      break;
    case "delivered":
    case "refund_requested":
      styleClasses = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      break;
    case "Draft":
    case "DRAFT":
    case "draft":
    case "Refunded":
    case "REFUNDED":
    case "refunded":
    case "resolved":
      styleClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20";
      break;
    case "Critical":
    case "CRITICAL":
    case "critical":
    case "Disputed":
    case "DISPUTED":
    case "disputed":
    case "failed":
      styleClasses = "bg-red-500/10 text-red-500 border-red-500/20";
      break;
    case "BLOCKED":
    case "blocked":
      styleClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case "Archived":
    case "archived":
    case "Banned":
    case "banned":
      styleClasses = "bg-rose-900/20 text-rose-600 border-rose-900/30";
      break;
    default:
      styleClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }

  const label = status.replace(/_/g, " ").toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${styleClasses} ${className}`}
    >
      {label}
    </span>
  );
}
