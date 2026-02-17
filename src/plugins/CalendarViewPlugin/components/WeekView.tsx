import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import EventChip from "./EventChip";
import TimeSlotCell from "./TimeSlotCell";
import { CalendarEvent } from "../hooks/useCalendarData";
import {
  getEventsForDateKey,
  getHourLabel,
  isDateTimeFieldType
} from "../utils/calendarViewUtils";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  dateField?: any;
  columns?: any[];
  fieldConfig?: any[];
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  dateField,
  columns,
  fieldConfig,
}) => {
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Check if the date field is datetime type
  const isDateTimeField = useMemo(() => {
    return isDateTimeFieldType(dateField);
  }, [dateField]);

  // Generate week days
  const weekDaysData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Generate time slots for datetime fields
  const timeSlots = useMemo(() => {
    if (!isDateTimeField) return [];

    const slots: Array<{ hour: number; label: string; time: string }> = [];

    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: getHourLabel(hour),
        time: `${hour.toString().padStart(2, '0')}:00`
      });
    }

    return slots;
  }, [isDateTimeField]);

  // Get events for a specific date

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is weekend (Saturday or Sunday)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  if (isDateTimeField) {
    // DateTime field - show time slots
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Week day headers */}
        <div className="grid grid-cols-8 border-b flex-shrink-0">
          <div className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 border-r">
            Time
          </div>
          {weekDaysData.map((date) => {
            const isWeekendDay = isWeekend(date);
            const isTodayDate = isToday(date);

            let dayHeaderClass = 'bg-gray-50 text-gray-500';

            if (isTodayDate) {
              dayHeaderClass = 'bg-[var(--color-bg-brand-primary)] text-black';
            } else if (isWeekendDay) {
              dayHeaderClass = 'bg-gray-100 text-gray-600';
            }

            return (
              <div
                key={date.toDateString()}
                className={`p-2 text-center text-sm font-medium border-r flex items-center justify-center gap-2 flex-row-reverse ${dayHeaderClass}`}
              >
                <div className="font-semibold">{weekDays[date.getDay()]}</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs">{date.getDate()}</span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Time slots and events */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="border-r">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-12 border-b flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-gray-500">{slot.label}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDaysData.map((date, _dayIndex) => {
              const isWeekendDay = isWeekend(date);
              return (
                <div
                  key={date.toDateString()}
                  className={`border-r ${isWeekendDay ? 'bg-gray-50' : ''}`}
                >
                  {timeSlots.map((slot) => {
                    return (
                      <TimeSlotCell
                        key={`${date.toDateString()}-${slot.hour}`}
                        date={date}
                        hour={slot.hour}
                        events={events}
                        onEventClick={onEventClick}
                        onDateClick={onDateClick}
                        columns={columns}
                        fieldConfig={fieldConfig}
                        className="h-12 border-b relative group overflow-visible"
                        enableKeyboard={true}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } else {
    // Date field - show full day events
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
          {weekDaysData.map((date) => {
            const isWeekendDay = isWeekend(date);
            const isTodayDate = isToday(date);

            let dayHeaderClass = 'bg-gray-50 text-gray-500';

            if (isTodayDate) {
              dayHeaderClass = 'bg-[var(--color-bg-brand-primary)] text-black';
            } else if (isWeekendDay) {
              dayHeaderClass = 'bg-gray-100 text-gray-600';
            }

            return (
              <div
                key={date.toDateString()}
                className={`p-2 text-center text-sm font-medium border-r flex items-center justify-center flex-row-reverse gap-2 ${dayHeaderClass}`}
              >
                <div className="font-semibold">{weekDays[date.getDay()]}</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs">{date.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Events grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-7 h-full">
            {weekDaysData.map((date) => {
              const isWeekendDay = isWeekend(date);
              const dayEvents = getEventsForDateKey(events, date);

              return (
                <div
                  key={date.toDateString()}
                  className={`border-r border-gray-200 p-2 relative group ${isWeekendDay ? 'bg-gray-50' : 'bg-background'
                    }`}
                >
                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                        columns={columns}
                        fieldConfig={fieldConfig}
                      />
                    ))}
                  </div>

                  {/* Add event button on hover */}
                  {onDateClick && (
                    <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                      <button
                        onClick={() => onDateClick(date)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
};

export default WeekView;
