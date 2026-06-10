export type AdminUserStatus = "active" | "banned" | "pending";

const styles: Record<AdminUserStatus, { dot: string; text: string }> = {
  active: { dot: "bg-green-500", text: "text-green-500" },
  banned: { dot: "bg-red-500", text: "text-red-500" },
  pending: { dot: "bg-amber-500", text: "text-amber-500" },
};

export function UserStatusDot({ status }: { status: AdminUserStatus }) {
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium capitalize ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
