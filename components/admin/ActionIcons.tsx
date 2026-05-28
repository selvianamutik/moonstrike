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
        <Link href={editHref} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#8B5CF6] transition-colors" aria-label="Edit">
          <Pencil size={16} />
        </Link>
      )}
      {previewHref && (
        <Link href={previewHref} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE] transition-colors" aria-label="Preview">
          <Eye size={16} />
        </Link>
      )}
      {historyHref && (
        <Link href={historyHref} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE] transition-colors" aria-label="History">
          <History size={16} />
        </Link>
      )}
      {onHide && (
        <button type="button" onClick={onHide} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE] transition-colors" aria-label="Hide">
          <EyeOff size={16} />
        </button>
      )}
      {onBan && (
        <button type="button" onClick={onBan} className="p-2 text-[var(--ms-text-secondary)] hover:text-amber-400 transition-colors" aria-label="Ban">
          <Ban size={16} />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="p-2 text-[var(--ms-text-secondary)] hover:text-red-400 transition-colors" aria-label="Delete">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
