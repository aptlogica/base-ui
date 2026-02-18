import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import EventChip from "./EventChip";
import MoreEventsDropdown from "./MoreEventsDropdown";
import { CalendarEvent } from "../hooks/useCalendarData";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  columns?: any[];
  fieldConfig?: any[];
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  columns,
  fieldConfig,
}) => {
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Check if date is weekend (Saturday or Sunday)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday; otherwise go back (dayOfWeek - 1) days
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const days: Date[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    // Use local date format to match event.date format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return events.filter(event => event.date === dateStr);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
        {weekDays.map((day, index) => {
          const isWeekendHeader = index >= 5; // Saturday (index 5) and Sunday (index 6)
          return (
            <div
              key={day}
              className={`p-2 text-center text-sm font-medium border-r border-gray-200 ${isWeekendHeader
                ? 'bg-gray-100 text-gray-600'
                : 'bg-gray-50 text-gray-500'
                }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-hidden" style={{ gridAutoRows: '1fr' }}>
        {calendarDays.map((date, _index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isWeekendDay = isWeekend(date);

          let dayCellBgClass = '';
          if (!isTodayDate) {
            if (isCurrentMonthDay) {
              dayCellBgClass = isWeekendDay ? 'bg-gray-50' : 'bg-background';
            } else {
              dayCellBgClass = 'bg-gray-50';
            }
          }

          let dateTextClass = 'text-gray-400';

          if (isCurrentMonthDay) {
            dateTextClass = isTodayDate
              ? 'p-1 h-8 w-8 rounded-full bg-[var(--color-bg-brand-primary)] text-black'
              : 'text-gray-900';
          }

          return (
            <div
              key={date.toISOString()}
              className={`border-r border-b border-gray-200 overflow-visible p-2 relative group flex flex-col ${dayCellBgClass}`}
              style={{ position: 'relative', minHeight: 0 }}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium text-center ${dateTextClass}`}>
                  {date.getDate()}
                </span>

                {isCurrentMonthDay && onDateClick && (
                  <button
                    onClick={() => onDateClick(date)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                )}
              </div>

              {/* Events - show first event, then "+n more" on the right */}
              <div className="flex-1 flex flex-col min-h-0">
                {dayEvents.length > 0 && (
                  <div className="flex items-center gap-1">
                    {/* First event */}
                    <div className="flex-1 min-w-0">
                      {dayEvents.slice(0, 1).map((event) => (
                        <EventChip
                          key={event.id}
                          event={event}
                          onClick={onEventClick ? () => onEventClick(event) : undefined}
                          columns={columns}
                          fieldConfig={fieldConfig}
                        />
                      ))}
                    </div>

                    {/* Show "+n more" dropdown on the right if there are additional events */}
                    {dayEvents.length > 1 && (
                      <div //NOSONAR
                        className="flex-shrink-0" onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();   // prevent page scroll on Space
                            e.stopPropagation();
                          }
                        }}>
                        <MoreEventsDropdown
                          events={dayEvents.slice(1)}
                          onEventClick={onEventClick}
                          columns={columns}
                          fieldConfig={fieldConfig}
                        >
                          <div className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors cursor-pointer">
                            + {dayEvents.length - 1}
                          </div>
                        </MoreEventsDropdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default MonthView;