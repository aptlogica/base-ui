import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface PopoverMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

type Align = 'left' | 'right' | 'auto';

interface PopoverMenuProps {
  trigger: React.ReactNode;
  items: PopoverMenuItem[];
  align?: Align;
  className?: string;
  portaled?: boolean; // New prop to enable portaling
}

// Helper functions for positioning calculations
const calculateHorizontalPosition = (
  align: Align,
  buttonRect: DOMRect,
  menuWidth: number,
  viewportWidth: number,
  scrollX: number
): number => {
  if (align === 'right') {
    return buttonRect.right + scrollX - menuWidth;
  }
  if (align === 'left') {
    return buttonRect.left + scrollX;
  }
  // Auto: prefer right alignment for right-side buttons, left for left-side
  const spaceRight = viewportWidth - buttonRect.right;
  if (buttonRect.right > viewportWidth * 0.6 || spaceRight < menuWidth) {
    return buttonRect.right + scrollX - menuWidth;
  }
  return buttonRect.left + scrollX;
};

const adjustHorizontalForViewport = (
  left: number,
  menuWidth: number,
  viewportWidth: number,
  margin: number
): number => {
  if (left < margin) {
    return margin;
  }
  if (left + menuWidth > viewportWidth - margin) {
    return viewportWidth - menuWidth - margin;
  }
  return left;
};

const calculateVerticalPosition = (
  buttonRect: DOMRect,
  menuHeight: number,
  viewportHeight: number,
  scrollY: number
): number => {
  let top = buttonRect.bottom + scrollY + 8; // Default: below button
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // If not enough space below, open above
  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
    top = buttonRect.top + scrollY - menuHeight - 8;
  }
  return top;
};

const adjustVerticalForViewport = (
  top: number,
  menuHeight: number,
  viewportHeight: number,
  scrollY: number,
  margin: number
): number => {
  if (top < scrollY + margin) {
    return scrollY + margin;
  }
  if (top + menuHeight > scrollY + viewportHeight - margin) {
    return scrollY + viewportHeight - menuHeight - margin;
  }
  return top;
};

interface PortaledPositionParams {
  buttonRect: DOMRect;
  menuWidth: number;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
  align: Align;
}

const calculatePortaledPosition = (params: PortaledPositionParams) => {
  const { buttonRect, menuWidth, menuHeight, viewportWidth, viewportHeight, scrollX, scrollY, align } = params;
  const margin = 10;
  let left = calculateHorizontalPosition(align, buttonRect, menuWidth, viewportWidth, scrollX);
  left = adjustHorizontalForViewport(left, menuWidth, viewportWidth, margin);
  let top = calculateVerticalPosition(buttonRect, menuHeight, viewportHeight, scrollY);
  top = adjustVerticalForViewport(top, menuHeight, viewportHeight, scrollY, margin);
  return { top, left };
};

const calculateRelativePosition = (
  buttonRect: DOMRect,
  menuRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
  align: Align
) => {
  let horizontal: Align = 'left';
  let vertical: 'up' | 'down' = 'down';

  // Auto-detect horizontal position
  if (align === 'auto') {
    const spaceRight = viewportWidth - buttonRect.right;
    const spaceLeft = buttonRect.left;
    if (spaceRight < menuRect.width && spaceLeft > menuRect.width) {
      horizontal = 'right';
    }
  } else {
    horizontal = align;
  }

  // Auto-detect vertical position
  const spaceDown = viewportHeight - buttonRect.bottom;
  const spaceUp = buttonRect.top;
  if (spaceDown < menuRect.height && spaceUp > spaceDown) {
    vertical = 'up';
  }

  return { horizontal, vertical };
};

export const PopoverMenu: React.FC<PopoverMenuProps> = ({
  trigger,
  items,
  align = 'auto',
  className,
  portaled = false // Default to false for backward compatibility
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ horizontal: 'left', vertical: 'down' });
  const [absolutePosition, setAbsolutePosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate optimal position when menu opens
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    if (portaled) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Get actual menu dimensions if available, otherwise use estimates
      const menuWidth = menuRef.current?.offsetWidth || 210; // min-w-[210px]
      const menuHeight = menuRef.current?.offsetHeight || (items.length * 40 + 16); // Estimate: ~40px per item + padding

      const position = calculatePortaledPosition({
        buttonRect,
        menuWidth,
        menuHeight,
        viewportWidth,
        viewportHeight,
        scrollX,
        scrollY,
        align
      });
      setAbsolutePosition(position);
    }

    // Original relative positioning logic
    if (!portaled && buttonRef.current && menuRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const position = calculateRelativePosition(
          buttonRect,
          menuRect,
          viewportWidth,
          viewportHeight,
          align
        );
        setPosition(position);
    }
  }, [open, align, portaled, items.length]);

  // Recalculate position after menu is rendered (to get actual dimensions)
  useEffect(() => {
    if (!open || !portaled || !buttonRef.current || !menuRef.current) return;

    // Use requestAnimationFrame to ensure menu is rendered
    requestAnimationFrame(() => {
      const buttonRect = buttonRef.current!.getBoundingClientRect();
      const menuRect = menuRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const menuWidth = menuRect.width;
      const menuHeight = menuRect.height;

      // Calculate initial position based on align prop
      let left: number;
      if (align === 'right') {
        left = buttonRect.right + scrollX - menuWidth;
      } else if (align === 'left') {
        left = buttonRect.left + scrollX;
      } else {
        // Auto: prefer right alignment for right-side buttons
        const spaceRight = viewportWidth - buttonRect.right;
        if (buttonRect.right > viewportWidth * 0.6 || spaceRight < menuWidth) {
          left = buttonRect.right + scrollX - menuWidth;
        } else {
          left = buttonRect.left + scrollX;
        }
      }

      // Adjust horizontal position for viewport boundaries
      const margin = 10;
      if (left < margin) {
        left = margin;
      } else if (left + menuWidth > viewportWidth - margin) {
        left = viewportWidth - menuWidth - margin;
      }

      // Calculate vertical position
      let top = buttonRect.bottom + scrollY + 8;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        top = buttonRect.top + scrollY - menuHeight - 8;
      }

      // Adjust vertical position for viewport boundaries
      if (top < scrollY + margin) {
        top = scrollY + margin;
      } else if (top + menuHeight > scrollY + viewportHeight - margin) {
        top = scrollY + viewportHeight - menuHeight - margin;
      }

      setAbsolutePosition({ top, left });
    });
  }, [open, portaled, align, items.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const getMenuClasses = () => {
    if (portaled) {
      return `fixed z-[9999] min-w-[210px] p-2 space-y-1 bg-card border rounded-xl shadow-lg`;
    }

    const horizontalClass = position.horizontal === 'right' ? 'right-0' : 'left-0';
    const verticalClass = position.vertical === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
    return `absolute z-50 min-w-[210px] p-2 space-y-1 bg-card border rounded-xl shadow-lg ${horizontalClass} ${verticalClass}`;
  };

  const renderMenu = () => (
    <div
      ref={menuRef}
      className={getMenuClasses()}
      data-popover-menu-portal={portaled ? 'true' : undefined}
      style={portaled ? {
        top: `${absolutePosition.top}px`,
        left: `${absolutePosition.left}px`
      } : undefined}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-xl ${item.label.toLowerCase().includes('delete') || item.label.toLowerCase().includes('remove') ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100"} transition-colors duration-200 ${item.danger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-700 hover:bg-gray-100'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              setOpen(false);
              item.onClick();
            }
          }}
          disabled={item.disabled}
          tabIndex={0}
        >
          {item.icon && <span className="w-4 h-4 flex items-center justify-center text-gray-600">{item.icon}</span>}
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative inline-block ${className || ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center justify-center p-1.5 rounded-xl hover:bg-gray-300  focus:outline-none transition-colors duration-200"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        portaled ? ReactDOM.createPortal(renderMenu(), document.body) : renderMenu()
      )}
    </div>
  );
};
