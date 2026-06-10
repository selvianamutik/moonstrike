import Link from "next/link";
import { Pencil, Eye, EyeOff, Trash2, Ban, History } from "lucide-react";
import { ActionTooltip } from "@/components/common/ActionTooltip";

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
        <ActionTooltip label="Edit">
          <Link href={editHref} className="admin-action-icon hover:border-[#8B5CF6] hover:text-[#8B5CF6]" aria-label="Edit">
            <Pencil size={16} />
          </Link>
        </ActionTooltip>
      )}
      {previewHref && (
        <ActionTooltip label="Preview">
          <Link href={previewHref} className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]" aria-label="Preview">
            <Eye size={16} />
          </Link>
        </ActionTooltip>
      )}
      {historyHref && (
        <ActionTooltip label="History">
          <Link href={historyHref} className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]" aria-label="History">
            <History size={16} />
          </Link>
        </ActionTooltip>
      )}
      {onHide && (
        <ActionTooltip label="Hide">
          <button type="button" onClick={onHide} className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]" aria-label="Hide">
            <EyeOff size={16} />
          </button>
        </ActionTooltip>
      )}
      {onBan && (
        <ActionTooltip label="Ban">
          <button type="button" onClick={onBan} className="admin-action-icon hover:border-amber-400 hover:text-amber-400" aria-label="Ban">
            <Ban size={16} />
          </button>
        </ActionTooltip>
      )}
      {onDelete && (
        <ActionTooltip label="Delete">
          <button type="button" onClick={onDelete} className="admin-action-icon hover:border-red-400 hover:text-red-400" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </ActionTooltip>
      )}
    </div>
  );
}
