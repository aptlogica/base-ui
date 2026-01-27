import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GanttTask } from './useGanttData';
import { buildGanttTooltipLines } from '../utils/buildGanttTooltip';
import type { Column } from '../../../types/api.types';

interface UseGanttTimelineOptions {
  filteredTasks: GanttTask[];
  columns: Column[];
  fieldConfig?: Array<{ id: string; isHidden?: boolean; position?: number }>;
}

export function useGanttTimeline({ filteredTasks, columns, fieldConfig }: UseGanttTimelineOptions) {
  // Timeline state
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1); // Start from 1 month ago
  });
  const [timelineEnd, setTimelineEnd] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 3, 0); // End 3 months from now
  });
  const [dayWidth, setDayWidth] = useState(30);

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [tooltipTask, setTooltipTask] = useState<GanttTask | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Adjust timeline based on actual task dates
  useEffect(() => {
    if (filteredTasks && filteredTasks.length > 0) {
      const allDates = filteredTasks.flatMap(task => [task.startDate, task.endDate]);
      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

      // Add some padding (1 month before and after)
      const padding = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const newStart = new Date(minDate.getTime() - padding);
      const newEnd = new Date(maxDate.getTime() + padding);

      setTimelineStart(newStart);
      setTimelineEnd(newEnd);
    }
  }, [filteredTasks]);

  // Generate timeline days
  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(timelineStart);
    while (current <= timelineEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [timelineStart, timelineEnd]);

  // Calculate task positions
  const getTaskPosition = useCallback((task: GanttTask) => {
    const startOffset = Math.floor((task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));

    const position = {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, 20)
    };

    return position;
  }, [timelineStart, dayWidth]);

  // Zoom controls
  const zoomIn = useCallback(() => setDayWidth(prev => Math.min(100, prev + 10)), []);
  const zoomOut = useCallback(() => setDayWidth(prev => Math.max(15, prev - 10)), []);
  const resetZoom = useCallback(() => setDayWidth(30), []);

  // Tooltip handlers
  const handleTaskMouseEnter = useCallback((task: GanttTask) => {
    setTooltipTask(task);
    setShowTooltip(true);
  }, []);

  const handleTaskMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setTooltipTask(null);
  }, []);

  // Calculate tooltip position based on available space
  useEffect(() => {
    if (showTooltip && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let position: 'top' | 'bottom' | 'left' | 'right' = 'top';

      // Check if there's space below
      if (tooltipRect.bottom + 10 <= viewportHeight) {
        position = 'bottom';
      }
      // Check if there's space to the right
      else if (tooltipRect.right + 10 <= viewportWidth) {
        position = 'right';
      }
      // Check if there's space to the left
      else if (tooltipRect.left - 10 >= 0) {
        position = 'left';
      }
      // Otherwise, keep 'top' as default (already set above)

      setTooltipPosition(position);
    }
  }, [showTooltip]);

  // Tooltip helper functions
  const getTooltipClasses = useCallback(() => {
    // Allow long content (URLs, attachments) to wrap instead of overflowing
    const baseClasses =
      "absolute z-[99999] bg-card text-primary text-xs rounded-xl p-3 shadow-2xl " +
      "max-w-xl whitespace-normal break-words pointer-events-none";

    switch (tooltipPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  }, [tooltipPosition]);

  const getTooltipArrowClasses = useCallback(() => {
    const baseClasses = "absolute w-2 h-2 bg-card transform rotate-45";

    switch (tooltipPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 -mt-1`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 -mb-1`;
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 -ml-1`;
      case 'right':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 -mr-1`;
      default:
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 -mt-1`;
    }
  }, [tooltipPosition]);

  // Build tooltip lines using the tooltip builder
  const tooltipLines = useMemo(() => {
    if (!tooltipTask) return [];
    return buildGanttTooltipLines({
      task: tooltipTask,
      columns: columns,
      options: {
        formatTime: (time: string) => {
          const [hours, minutes] = time.split(':');
          const hour = Number.parseInt(hours, 10);
          const minute = Number.parseInt(minutes, 10);
          const period = hour >= 12 ? 'PM' : 'AM';
          
          // Convert 24-hour format to 12-hour format
          let displayHour: number;
          if (hour === 0) {
            displayHour = 12;
          } else if (hour > 12) {
            displayHour = hour - 12;
          } else {
            displayHour = hour;
          }
          
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        },
        fieldConfig,
      }
    });
  }, [tooltipTask, columns, fieldConfig]);

  return {
    // State
    timelineStart,
    timelineEnd,
    dayWidth,
    timelineDays,
    showTooltip,
    tooltipPosition,
    tooltipTask,
    tooltipRef,
    tooltipLines,
    
    // Handlers
    getTaskPosition,
    zoomIn,
    zoomOut,
    resetZoom,
    handleTaskMouseEnter,
    handleTaskMouseLeave,
    getTooltipClasses,
    getTooltipArrowClasses,
  };
}

