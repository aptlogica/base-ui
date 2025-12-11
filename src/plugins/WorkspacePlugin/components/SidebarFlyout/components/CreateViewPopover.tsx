import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { VIEW_TYPES, VIEW_ICONS } from '../../../../../types/viewTypes';
import { CreateViewPopoverProps } from '../types';
import { PlusIcon } from 'lucide-react';

export const CreateViewPopover: React.FC<CreateViewPopoverProps> = ({ 
  anchorRef, 
  onOpenModal, 
  onClose, 
  setPopoverRef 
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Calculate position with smart above/below detection
  const getPosition = () => {
    if (!anchorRef.current) {
      return { top: 0, left: 0, placement: 'below' as const };
    }
    
    const rect = anchorRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Get actual popover dimensions if available, otherwise estimate
    const popover = popoverRef.current;
    const popoverHeight = popover?.offsetHeight || VIEW_TYPES.length * 36 + 16; // ~36px per item + padding
    const popoverWidth = popover?.offsetWidth || 150; // min-w-[150px]

    // Calculate space below and above
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Determine if we should open above or below
    // Open above if: not enough space below AND more space above than below
    const shouldOpenAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    // Calculate top position
    let top: number;
    if (shouldOpenAbove) {
      // Position above the anchor
      top = rect.top + scrollY - popoverHeight - 4;
    } else {
      // Position below the anchor (default)
      top = rect.bottom + scrollY + 4;
    }

    // Ensure popover doesn't go off-screen vertically
    const minTop = scrollY + 8;
    const maxTop = scrollY + viewportHeight - popoverHeight - 8;
    top = Math.max(minTop, Math.min(top, maxTop));

    // Calculate left position
    let left = rect.left + scrollX;

    // Adjust horizontal position if popover would go off-screen
    if (left + popoverWidth > viewportWidth + scrollX) {
      // Align to right edge of viewport
      left = viewportWidth + scrollX - popoverWidth - 8;
    }
    // Ensure minimum left margin
    left = Math.max(8, left);

    return { top, left, placement: shouldOpenAbove ? 'above' as const : 'below' as const };
  };

  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' }>(getPosition);
  const [isAnimating, setIsAnimating] = useState(true);

  // Use useLayoutEffect for accurate positioning after DOM updates
  useLayoutEffect(() => {
    // Update position when anchor changes or window resizes
    const updatePosition = () => {
      const newPosition = getPosition();
      setPosition(newPosition);
    };
    
    // Update immediately and after a frame to get accurate dimensions
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);

  // Trigger animation on mount and when placement changes
  useEffect(() => {
    setIsAnimating(true);
    // Use requestAnimationFrame to ensure DOM is ready, then trigger animation
    const raf = requestAnimationFrame(() => {
      // Small delay to ensure the element is rendered before animating
      setTimeout(() => setIsAnimating(false), 10);
    });
    return () => cancelAnimationFrame(raf);
  }, [position.placement]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (setPopoverRef && popoverRef.current) setPopoverRef(popoverRef.current);
  }, [setPopoverRef]);

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[150px] overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: position.placement === 'above' ? 'bottom center' : 'top center',
        transform: isAnimating 
          ? (position.placement === 'above' 
              ? 'translateY(8px) scaleY(0.8)' 
              : 'translateY(-8px) scaleY(0.8)')
          : 'translateY(0) scaleY(1)',
        opacity: isAnimating ? 0 : 1,
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
    >
      {/* <div className="text-xs font-medium text-[var(--color-text-primary)] mb-2 px-2">Select View Type</div> */}
      <div className="space-y-1">
        {VIEW_TYPES.map((viewType) => {
          const viewIconInfo = VIEW_ICONS[viewType.type as keyof typeof VIEW_ICONS] || VIEW_ICONS.grid;
          const IconComponent = viewIconInfo.icon;
          return (
            <button
              key={viewType.type}
              className="w-full px-2 py-1.5 flex items-center gap-2 text-left text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors duration-200"
              onClick={() => {
                onOpenModal(viewType.type);
                onClose();
              }}
            >
              {IconComponent && <IconComponent size={16} color={viewIconInfo.color} />}
              <div className="flex-1">{viewType.label}</div>
              <PlusIcon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};


