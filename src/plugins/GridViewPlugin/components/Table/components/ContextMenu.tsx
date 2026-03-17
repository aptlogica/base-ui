// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { useContextMenuDismiss, useContextMenuPosition } from './useContextMenu';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  canDeleteRecord?: boolean;
  canEditRecord?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onDelete,
  onEdit,
  canDeleteRecord = true
  , canEditRecord = true
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useContextMenuPosition(x, y, menuRef, {
    menuHeightFallback: 200,
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
    border: '',
    padding: 5,
    overflow: 'hidden',
  };

  return (
    <div ref={menuRef} style={style} className="select-none border p-2 space-y-1 animate-fade-in">
      {/* Delete record - only show if user can delete */}
      {/* Edit record - only show if user can edit */}
      {canEditRecord && (
        <>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (onEdit) onEdit();
              onClose();
            }}
          >
            <Edit className="w-5 h-5" /> Edit record
          </button>
          <div className="border-t my-1" />
        </>
      )}

      {/* Delete record - only show if user can delete */}
      {canDeleteRecord && (
        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black transition-colors" onClick={onDelete}>
          <Trash2 className="w-5 h-5" /> Delete record
        </button>
      )}
    </div>
  );
}; 
