import React, { useMemo } from "react";
import { CalendarEvent } from "../hooks/useCalendarData";

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: string) => void;
}

const YearView: React.FC<YearViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onViewChange,
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate calendar data for each month
  const monthCalendars = useMemo(() => {
    const year = currentDate.getFullYear();

    return months.map((monthName, monthIndex) => {
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday

      const days: Date[] = [];
      const current = new Date(startDate);

      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return {
        monthName,
        monthIndex,
        days,
        firstDay,
        lastDay
      };
    });
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
  const isCurrentMonth = (date: Date, monthIndex: number) => {
    return date.getMonth() === monthIndex;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Year header */}
      <div className="border-b p-2 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentDate.getFullYear()}
        </h2>
      </div>

      {/* Months grid */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="grid grid-cols-3 gap-6">
          {monthCalendars.map(({ monthName, monthIndex, days }) => (
            <div key={monthIndex} className="bg-card border border-gray-200 rounded-xl p-4">
              {/* Month header */}
              <div className="text-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
              </div>

              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-medium text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date) => {
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonthDay = isCurrentMonth(date, monthIndex);
                  const isTodayDate = isToday(date);

                  let dayCellClass = 'text-gray-400';

                  if (isCurrentMonthDay) {
                    dayCellClass = isTodayDate
                      ? 'bg-[var(--color-bg-brand-primary)] text-black'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-brand-primary)] hover:text-black';
                  }

                  return (
                    <div //NOSONAR
                      key={date.toDateString()}
                      className={`relative aspect-square flex flex-col items-center justify-center text-xs cursor-pointer rounded-full transition-colors ${dayCellClass}`}
                      onClick={() => onDateSelect(date)}
                      onDoubleClick={() => {
                        onDateSelect(date);
                        onViewChange?.('day');
                      }}
                    >
                      {/* Event indicators - show dot if date has events */}
                      {dayEvents.length > 0 && (
                        <div className="absolute -top-2 flex justify-center mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-bg-brand-primary)]" title={`${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`} />
                        </div>
                      )}
                      <span className="text-xs">{date.getDate()}</span>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearView;