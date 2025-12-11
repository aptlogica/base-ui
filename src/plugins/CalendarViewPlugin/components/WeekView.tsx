import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import EventChip from "./EventChip";
import MoreEventsDropdown from "./MoreEventsDropdown";
import { CalendarEvent } from "../hooks/useCalendarData";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  dateField?: any;
  columns?: any[];
  fieldConfig?: any[];
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onDateSelect,
  dateField,
  columns,
  fieldConfig,
}) => {
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Check if the date field is datetime type
  const isDateTimeField = useMemo(() => {
    if (!dateField) return false;
    const datetimeTypes = ['datetime', 'createdtime', 'lastmodifiedtime'];
    return datetimeTypes.includes(dateField.type?.toLowerCase() || '') ||
           datetimeTypes.includes(dateField.uidt?.toLowerCase() || '');
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
        label: hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`,
        time: `${hour.toString().padStart(2, '0')}:00`
      });
    }
    return slots;
  }, [isDateTimeField]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    // Use local date format to match event.date format (event.date is extracted from string)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return events.filter(event => event.date === dateStr);
  };

  // Get events for a specific time slot (datetime fields only)
  const getEventsForTimeSlot = (date: Date, hour: number) => {
    if (!isDateTimeField) return [];
    
    // Use local date format to match event.date format (event.date is extracted from string)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => {
      if (event.date !== dateStr) return false;
      const eventHour = new Date(event.dateTime).getHours();
      return eventHour === hour;
    });
  };

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
          {weekDaysData.map((date, index) => {
            const isWeekendDay = isWeekend(date);
            const isTodayDate = isToday(date);
            return (
              <div
                key={index}
                className={`p-2 text-center text-sm font-medium border-r flex items-center justify-center gap-2 flex-row-reverse ${
                  isTodayDate 
                    ? 'bg-[var(--color-bg-brand-primary)] text-black' 
                    : isWeekendDay 
                      ? 'bg-gray-100 text-gray-600' 
                      : 'bg-gray-50 text-gray-500'
                }`}
              >
                <div className="font-semibold">{weekDays[index]}</div>
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
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="h-12 border-b flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-gray-500">{slot.label}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDaysData.map((date, dayIndex) => {
              const isWeekendDay = isWeekend(date);
              return (
              <div 
                key={dayIndex} 
                className={`border-r ${isWeekendDay ? 'bg-gray-50' : ''}`}
              >
                {timeSlots.map((slot, slotIndex) => {
                  const slotEvents = getEventsForTimeSlot(date, slot.hour);
                  const hasEvents = slotEvents.length > 0;
                  
                  return (
                    <div
                      key={slotIndex}
                      className="h-12 border-b relative group overflow-visible"
                      onClick={() => {
                        // Only trigger date click if clicking on empty space (not on events)
                        if (!hasEvents) {
                          const dateWithTime = new Date(date);
                          dateWithTime.setHours(slot.hour, 0, 0, 0);
                          onDateClick(dateWithTime);
                        }
                      }}
                    >
                      {/* Time slot events - show first event, then dropdown for more */}
                      {hasEvents && (
                        <div className="absolute top-0 left-0 right-0 m-1 z-10">
                          <div className="flex items-center gap-1">
                            {/* First event */}
                            <div className="flex-1 min-w-0">
                              {slotEvents.slice(0, 1).map((event) => (
                                <EventChip
                                  key={event.id}
                                  event={event}
                                  onClick={onEventClick}
                                  columns={columns}
                                  fieldConfig={fieldConfig}
                                />
                              ))}
                            </div>
                            
                            {/* Show "+n more" dropdown on the right if there are additional events */}
                            {slotEvents.length > 1 && (
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <MoreEventsDropdown
                                  events={slotEvents.slice(1)}
                                  onEventClick={onEventClick}
                                  columns={columns}
                                  fieldConfig={fieldConfig}
                                >
                                  <div className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors cursor-pointer">
                                    + {slotEvents.length - 1}
                                  </div>
                                </MoreEventsDropdown>
                              </div>
                            )}
                            
                            {/* Add event button on the right side when there are events */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dateWithTime = new Date(date);
                                  dateWithTime.setHours(slot.hour, 0, 0, 0);
                                  onDateClick(dateWithTime);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Add event button - only show when no events and on hover */}
                      {!hasEvents && (
                        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const dateWithTime = new Date(date);
                              dateWithTime.setHours(slot.hour, 0, 0, 0);
                              onDateClick(dateWithTime);
                            }}
                            className="p-1 hover:bg-gray-200 rounded pointer-events-auto"
                          >
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
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
          {weekDaysData.map((date, index) => {
            const isWeekendDay = isWeekend(date);
            const isTodayDate = isToday(date);
            return (
            <div
              key={index}
              className={`p-2 text-center text-sm font-medium border-r flex items-center justify-center flex-row-reverse gap-2 ${
                isTodayDate 
                  ? 'bg-[var(--color-bg-brand-primary)] text-black' 
                  : isWeekendDay 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-gray-50 text-gray-500'
              }`}
            >
              <div className="font-semibold">{weekDays[index]}</div>
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
            {weekDaysData.map((date, index) => {
              const isWeekendDay = isWeekend(date);
              const dayEvents = getEventsForDate(date);
              
              return (
                <div
                  key={index}
                  className={`border-r border-gray-200 p-2 relative group ${
                    isWeekendDay ? 'bg-gray-50' : 'bg-background'
                  }`}
                >
                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                        columns={columns}
                        fieldConfig={fieldConfig}
                      />
                    ))}
                  </div>
                  
                  {/* Add event button on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                    <button
                      onClick={() => onDateClick(date)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
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