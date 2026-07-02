// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil, Trash2, ChevronUp } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/useClickOutside';

interface ColumnDropdownProps {
  onEdit: (anchorEl?: HTMLElement) => void;
  onDelete: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ColumnDropdown: React.FC<ColumnDropdownProps> = ({
  onEdit,
  onDelete,
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clickOutsideRef = useClickOutside({
    isOpen,
    onClose: () => setIsOpen(false),
    excludeRefs: [buttonRef]
  });

  // Calculate dropdown position when opening - use requestAnimationFrame to ensure dropdown is rendered
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get actual dropdown dimensions after render
      const dropdownWidth = dropdownRef.current?.offsetWidth || 192; // w-48 = 192px
      const dropdownHeight = dropdownRef.current?.offsetHeight || 200;

      // Calculate left position - align to right edge of button
      let left = rect.right - dropdownWidth;

      // Adjust if dropdown would go off-screen
      const margin = 10;
      if (left < margin) {
        left = rect.left; // Fallback to left edge of button
      } else if (left + dropdownWidth > viewportWidth - margin) {
        left = viewportWidth - dropdownWidth - margin;
      }

      // Calculate top position - prefer below button
      let top = rect.bottom + 8; // 8px gap below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If not enough space below, open above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 8;
      }

      // Adjust vertical position for viewport boundaries
      if (top < margin) {
        top = margin;
      } else if (top + dropdownHeight > viewportHeight - margin) {
        top = viewportHeight - dropdownHeight - margin;
      }

      setDropdownPosition({ top, left });
    };

    // Use requestAnimationFrame to ensure dropdown is rendered first
    requestAnimationFrame(() => {
      requestAnimationFrame(calculatePosition);
    });
  }, [isOpen]);

  const handleEdit = () => {
    onEdit(buttonRef.current ?? undefined);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded transition-colors duration-200"
        title="Column options"
      >
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-secondary" /> : <ChevronDown className="w-3.5 h-3.5 text-secondary" />}
      </button>

      {isOpen && createPortal(
        <div
          ref={(node) => {
            // Set both refs to the same node
            if (clickOutsideRef) {
              (clickOutsideRef as { current: HTMLDivElement | null }).current = node;
            }
            dropdownRef.current = node;
          }}
          className="fixed w-48 bg-[var(--color-alpha-white)] border border-gray-200 rounded-xl shadow-lg z-[9999] p-2"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {/* Edit field */}
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black transition-colors"
            title="Edit field"
          >
            <Pencil className="w-5 h-5 text-gray-500" />
            Edit Column
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Delete field */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black transition-colors"
            title="Delete field"
          >
            <Trash2 className="w-5 h-5" />
            Delete Column
          </button>
        </div>,
        document.body
      )}
    </>
  );
};
