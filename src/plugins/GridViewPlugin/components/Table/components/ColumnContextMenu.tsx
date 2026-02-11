import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

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
  const [position, setPosition] = useState({ top: y, left: x });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Calculate position to prevent going off-screen (similar to ContextMenu)
  useEffect(() => {
    if (!menuRef.current) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;

    // Use requestAnimationFrame to ensure menu is rendered before measuring
    requestAnimationFrame(() => {
      if (!menuRef.current) return;
      
      const menuRect = menuRef.current.getBoundingClientRect();
      const menuHeight = menuRect.height || 120; // Fallback estimate
      const menuWidth = menuRect.width || 180; // Fallback estimate

      let adjustedTop = y;
      let adjustedLeft = x;

      // Check if menu would go off bottom of screen
      const spaceBelow = viewportHeight - y;
      const spaceAbove = y;

      // If not enough space below and more space above, open above
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        adjustedTop = y - menuHeight;
      }

      // Ensure menu doesn't go above viewport
      if (adjustedTop < margin) {
        adjustedTop = margin;
      }

      // Ensure menu doesn't go below viewport
      if (adjustedTop + menuHeight > viewportHeight - margin) {
        adjustedTop = viewportHeight - menuHeight - margin;
      }

      // Check if menu would go off right edge
      if (x + menuWidth > viewportWidth - margin) {
        adjustedLeft = viewportWidth - menuWidth - margin;
      }

      // Ensure menu doesn't go off left edge
      if (adjustedLeft < margin) {
        adjustedLeft = margin;
      }

      setPosition({ top: adjustedTop, left: adjustedLeft });
    });
  }, [x, y]);

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
