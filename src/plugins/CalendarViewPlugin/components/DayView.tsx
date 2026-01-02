import React, { useMemo } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import EventChip from "./EventChip";
import MoreEventsDropdown from "./MoreEventsDropdown";
import { CalendarEvent } from "../hooks/useCalendarData";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  dateField?: any;
  columns?: any[];
  fieldConfig?: any[];
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onDateSelect,
  dateField,
  columns,
  fieldConfig,
}) => {
  // Check if the date field is datetime type
  const isDateTimeField = useMemo(() => {
    if (!dateField) return false;
    const datetimeTypes = ['datetime', 'createdtime', 'lastmodifiedtime'];
    return datetimeTypes.includes(dateField.type?.toLowerCase() || '') ||
           datetimeTypes.includes(dateField.uidt?.toLowerCase() || '');
  }, [dateField]);

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

  // Get events for the current date
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

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (isDateTimeField) {
    // DateTime field - show time slots
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Day header */}
        <div className="border-b p-2 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate)}
          </h2>
        </div>

        {/* Time slots and events */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex">
            {/* Time column */}
            <div className="w-16 border-r border-gray-200 bg-gray-50">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="h-12 border-b border-gray-100 flex items-center justify-center relative"
                >
                  <span className="text-xs text-gray-500 font-medium">{slot.label}</span>
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="flex-1 relative">
              {timeSlots.map((slot, slotIndex) => {
                const slotEvents = getEventsForTimeSlot(currentDate, slot.hour);
                const hasEvents = slotEvents.length > 0;
                
                return (
                  <div
                    key={slotIndex}
                    className="h-12 border-b border-gray-100 relative group overflow-visible"
                    onClick={() => {
                      // Only trigger date click if clicking on empty space (not on events)
                      if (!hasEvents && onDateClick) {
                        const dateWithTime = new Date(currentDate);
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
                                onClick={onEventClick || undefined}
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
                          {onDateClick && (
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dateWithTime = new Date(currentDate);
                                  dateWithTime.setHours(slot.hour, 0, 0, 0);
                                  onDateClick(dateWithTime);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Add event button - only show when no events and on hover */}
                    {!hasEvents && onDateClick && (
                      <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const dateWithTime = new Date(currentDate);
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
          </div>
        </div>
      </div>
    );
  } else {
    // Date field - show full day events
    return (
      <div className="flex-1 overflow-hidden">
        {/* Day header */}
        <div className="border-b p-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate)}
          </h2>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {getEventsForDate(currentDate).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2"><CalendarIcon className="w-8 h-8 mx-auto mb-2" /></div>
                <p>No events scheduled for this day</p>
                {onDateClick && (
                  <button
                    onClick={() => onDateClick(currentDate)}
                    className="mt-4 px-4 py-2 btn-primary"
                  >
                    Add Event
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {getEventsForDate(currentDate).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    className="mb-2"
                    columns={columns}
                    fieldConfig={fieldConfig}
                  />
                ))}
                
                {/* Add event button */}
                {onDateClick && (
                  <div className="pt-4">
                    <button
                      onClick={() => onDateClick(currentDate)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Event</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default DayView;