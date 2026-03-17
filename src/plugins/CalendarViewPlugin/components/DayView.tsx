// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import EventChip from "./EventChip";
import TimeSlotCell from "./TimeSlotCell";
import { CalendarEvent } from "../hooks/useCalendarData";
import {
  getEventsForDateKey,
  isDateTimeFieldType,
  createTimeSlots,
} from "../utils/calendarViewUtils";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  dateField?: any;
  columns?: any[];
  fieldConfig?: any[];
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  dateField,
  columns,
  fieldConfig,
}) => {
  // Check if the date field is datetime type
  const isDateTimeField = useMemo(() => {
    return isDateTimeFieldType(dateField);
  }, [dateField]);

  // Generate time slots for datetime fields
  const timeSlots = useMemo(() => {
    if (!isDateTimeField) return [];
    return createTimeSlots();
  }, [isDateTimeField]);

  // Get events for the current date

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
              {timeSlots.map((slot, _index) => (
                <div
                  key={slot.hour}
                  className="h-12 border-b border-gray-100 flex items-center justify-center relative"
                >
                  <span className="text-xs text-gray-500 font-medium">{slot.label}</span>
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="flex-1 relative">
              {timeSlots.map((slot, _slotIndex) => {
                return (
                  <TimeSlotCell
                    key={slot.hour}
                    date={currentDate}
                    hour={slot.hour}
                    events={events}
                    onEventClick={onEventClick}
                    onDateClick={onDateClick}
                    columns={columns}
                    fieldConfig={fieldConfig}
                    className="h-12 border-b border-gray-100 relative group overflow-visible"
                  />
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
            {getEventsForDateKey(events, currentDate).length === 0 ? (
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
                {getEventsForDateKey(events, currentDate).map((event) => (
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
                        <Plus className="w-5 h-5" />
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
