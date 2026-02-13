import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '../hooks/useCalendarData';
import { buildEventTooltipLines } from '../utils/buildEventTooltip';
import type { GridColumn } from '../../GridViewPlugin/types/grid.types';

export interface EventChipProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  columns?: GridColumn[];
  fieldConfig?: any[];
}

const EventChip: React.FC<EventChipProps> = ({
  event,
  onClick,
  className = '',
  columns,
  fieldConfig,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [tooltipCoords, setTooltipCoords] = useState<{ top: number; left: number } | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Memoize formatTime function to avoid recreation on every render
  const formatTime = useCallback((timeString: string) => {
    if (typeof timeString === 'string') {
      return timeString;
    }
    const date = timeString as any;
    if (date instanceof Date) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return String(timeString);
  }, []);

  // Memoize tooltip content to avoid recalculation on every render
  const tooltipLines = useMemo(() => {
    if (!showTooltip) return [];
    return buildEventTooltipLines({
      event,
      columns: columns || [],
      options: {
        formatTime,
        fieldConfig,
      },
    });
  }, [showTooltip, event, columns, fieldConfig, formatTime]);


  // Memoize display time to avoid recalculation
  const displayTime = useMemo(() => {
    // For date fields, don't show time
    if (event.isDateField) {
      return '';
    }
    // For datetime fields, show the actual time
    return event.dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }, [event.dateTime, event.isDateField]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  }, [onClick, event]);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Calculate tooltip position based on available space
  useEffect(() => {
    if (!showTooltip || !chipRef.current) return;

    const computePosition = () => {
      if (!chipRef.current) return;

      const chipRect = chipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Measure tooltip size if available; fallback to a reasonable guess
      const tooltipEl = tooltipRef.current;
      let tooltipWidth = 300;
      let tooltipHeight = 120;

      if (tooltipEl) {
        const tr = tooltipEl.getBoundingClientRect();
        tooltipWidth = tr.width || tooltipWidth;
        tooltipHeight = tr.height || tooltipHeight;
      }

      let position: 'top' | 'bottom' | 'left' | 'right';

      // Prefer top, then bottom, then right, then left based on space
      if (chipRect.top - tooltipHeight - 10 >= 0) {
        position = 'top';
      } else if (chipRect.bottom + tooltipHeight + 10 <= viewportHeight) {
        position = 'bottom';
      } else if (chipRect.right + tooltipWidth + 10 <= viewportWidth) {
        position = 'right';
      } else if (chipRect.left - tooltipWidth - 10 >= 0) {
        position = 'left';
      } else {
        position = 'bottom';
      }

      const horizontalCenter =
        chipRect.left + chipRect.width / 2 - tooltipWidth / 2;

      const verticalCenter =
        chipRect.top + chipRect.height / 2 - tooltipHeight / 2;

      let top: number;
      let left: number;

      switch (position) {
        case 'top':
          top = chipRect.top - tooltipHeight - 8;
          left = horizontalCenter;
          break;

        case 'bottom':
          top = chipRect.bottom + 8;
          left = horizontalCenter;
          break;

        case 'right':
          top = verticalCenter;
          left = chipRect.right + 8;
          break;

        case 'left':
          top = verticalCenter;
          left = chipRect.left - tooltipWidth - 8;
          break;
      }

      // Clamp to viewport
      left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
      top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

      setTooltipPosition(position);
      setTooltipCoords({ top, left });
    };


    // Compute immediately and on next frame to capture initial mount layout
    computePosition();
    const raf = requestAnimationFrame(computePosition);

    // Recompute on resize/scroll while tooltip is visible
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [showTooltip, tooltipLines]);

  // Memoize tooltip classes to avoid recalculation
  const tooltipClasses = useMemo(() => {
    const base =
      "fixed z-[9999] bg-card text-secondary text-sm rounded-xl p-3 shadow-2xl border " +
      "max-w-xl whitespace-normal break-words";

    const positionClassMap: Record<string, string> = {
      top: "mb-2",
      bottom: "mt-2",
      left: "mr-2",
      right: "ml-2"
    };

    return `${base} ${positionClassMap[tooltipPosition] ?? ''}`;
  }, [tooltipPosition]);

  // Memoize tooltip arrow classes
  const tooltipArrowClasses = useMemo(() => {
    const baseClasses = "absolute w-2 h-2 bg-card transform rotate-45";

    switch (tooltipPosition) {
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 -mb-1`;
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 -mt-1`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 -mr-1`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 -ml-1`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 -mb-1`;
    }
  }, [tooltipPosition]);

  return (
    <div className="relative" ref={chipRef}>
      <div
        onClick={onClick ? handleClick : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`py-0 bg-background border rounded-xl rounded-tl-lg rounded-bl-lg transition-colors group ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''} ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-1 h-8 bg-gray-300 rounded-tl-xl rounded-bl-xl flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {displayTime && `${displayTime} `}{event.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className={tooltipClasses}
          style={{
            top: `${tooltipCoords ? tooltipCoords.top : -9999}px`,
            left: `${tooltipCoords ? tooltipCoords.left : -9999}px`,
            transform: 'none',
            visibility: tooltipCoords ? 'visible' : 'hidden'
          }}
        >
          <div className="space-y-1">
            {tooltipLines.map((line, index) => (
              <div key={line} className={index === 0 ? "font-semibold text-primary text-sm" : "text-secondary text-xs"}>
                {line}
              </div>
            ))}
          </div>
          {/* Tooltip Arrow */}
          <div className={tooltipArrowClasses}></div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EventChip;
