import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil, Trash2, Copy, ChevronUp } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/useClickOutside';

interface ColumnDropdownProps {
  column: {
    id?: string;
    title: string;
    isSystem?: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export const ColumnDropdown: React.FC<ColumnDropdownProps> = ({
  column,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    onEdit();
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
      setIsOpen(false);
    }
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
       {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {isOpen && createPortal(
        <div 
          ref={(node) => {
            // Set both refs to the same node
            if (clickOutsideRef) {
              (clickOutsideRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
            className="w-full flex items-center gap-2 px-4 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
            title="Edit field"
          >
            <Pencil className="w-4 h-4" />
            Edit field
          </button>

          {/* Duplicate field */}
          {onDuplicate && (
            <button
            className="w-full flex items-center gap-2 px-4 py-2 text-[var(--color-text-primary)] rounded-xl opacity-50 cursor-not-allowed transition-colors" 
            disabled
            title="Coming soon"
            >
              <Copy className="w-4 h-4" />
              Duplicate field
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Delete field */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
            title="Delete field"
          >
            <Trash2 className="w-4 h-4" />
            Delete field
          </button>
        </div>,
        document.body
      )}
    </>
  );
};
