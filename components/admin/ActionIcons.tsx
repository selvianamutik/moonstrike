import Link from "next/link";
import { Pencil, Eye, EyeOff, Trash2, Ban, History } from "lucide-react";

type ActionIconsProps = {
  editHref?: string;
  onHide?: () => void;
  onDelete?: () => void;
  onBan?: () => void;
  historyHref?: string;
  previewHref?: string;
};

export function ActionIcons({ editHref, onHide, onDelete, onBan, historyHref, previewHref }: ActionIconsProps) {
  return (
    <div className="flex items-center gap-1">
      {editHref && (
        <Link href={editHref} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-accent)] transition-colors" aria-label="Edit">
          <Pencil size={16} aria-hidden="true" />
        </Link>
      )}
      {previewHref && (
        <Link href={previewHref} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-cyan)] transition-colors" aria-label="Preview">
          <Eye size={16} aria-hidden="true" />
        </Link>
      )}
      {historyHref && (
        <Link href={historyHref} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-cyan)] transition-colors" aria-label="History">
          <History size={16} aria-hidden="true" />
        </Link>
      )}
      {onHide && (
        <button type="button" onClick={onHide} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-[var(--admin-cyan)] transition-colors" aria-label="Hide">
          <EyeOff size={16} aria-hidden="true" />
        </button>
      )}
      {onBan && (
        <button type="button" onClick={onBan} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-amber-400 transition-colors" aria-label="Ban">
          <Ban size={16} aria-hidden="true" />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-muted)] hover:text-red-400 transition-colors" aria-label="Delete">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
