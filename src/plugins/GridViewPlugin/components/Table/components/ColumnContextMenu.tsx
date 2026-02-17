import React, { useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useContextMenuDismiss, useContextMenuPosition } from './useContextMenu';

interface ColumnContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useContextMenuPosition(x, y, menuRef, {
    menuHeightFallback: 120,
    menuWidthFallback: 180,
    margin: 10,
  });

  useContextMenuDismiss(menuRef, onClose);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    zIndex: 10000,
    minWidth: 180,
    background: 'var(--color-alpha-white)',
    borderRadius: 8,
    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
    border: '1px solid var(--color-border-subtle)',
    padding: 8,
    overflow: 'hidden',
  };

  return (
    <div ref={menuRef} style={style} className="select-none space-y-1 animate-fade-in">
      {/* Edit column */}
      {canUpdate && (
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
          title="Edit column"
        >
          <Pencil className="w-4 h-4" />
          Edit column
        </button>
      )}

      {canDelete && (
        <>
          <div className="border-t border-gray-100" />
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
            title="Delete column"
          >
            <Trash2 className="w-4 h-4" />
            Delete column
          </button>
        </>
      )}
    </div>
  );
};
