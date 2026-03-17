// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { CalendarEvent } from '../hooks/useCalendarData';

export const DATETIME_TYPES = new Set([
  'datetime',
  'createdtime',
  'lastmodifiedtime'
]);

export const isDateTimeFieldType = (dateField?: any): boolean => {
  if (!dateField) return false;
  const type = dateField.type?.toLowerCase();
  const uidt = dateField.uidt?.toLowerCase();
  return (Boolean(type) && DATETIME_TYPES.has(type)) || (Boolean(uidt) && DATETIME_TYPES.has(uidt));
};

export const getHourLabel = (hour: number): string => {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
};

export const createTimeSlots = (): Array<{ hour: number; label: string; time: string }> => {
  const slots: Array<{ hour: number; label: string; time: string }> = [];

  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      label: getHourLabel(hour),
      time: `${hour.toString().padStart(2, '0')}:00`
    });
  }

  return slots;
};

export const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRangeForView = (
  view: string,
  currentDate: Date
): { start: Date; end: Date } | null => {
  switch (view) {
    case 'week': {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    }

    case 'month': {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return { start: monthStart, end: monthEnd };
    }

    case 'year': {
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const yearEnd = new Date(
        currentDate.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999
      );
      return { start: yearStart, end: yearEnd };
    }

    default:
      return null;
  }
};

export const getEventsForDateKey = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const dateStr = toLocalDateKey(date);
  return events.filter(event => {
    const eventDateTime = event.dateTime instanceof Date ? event.dateTime : new Date(event.dateTime as any);
    if (!Number.isNaN(eventDateTime.getTime())) {
      return toLocalDateKey(eventDateTime) === dateStr;
    }
    return event.date === dateStr;
  });
};

export const getEventsForTimeSlot = (events: CalendarEvent[], date: Date, hour: number): CalendarEvent[] => {
  const dateStr = toLocalDateKey(date);
  return events.filter(event => {
    const eventDateTime = event.dateTime instanceof Date ? event.dateTime : new Date(event.dateTime as any);
    if (!Number.isNaN(eventDateTime.getTime())) {
      if (toLocalDateKey(eventDateTime) !== dateStr) return false;
      return eventDateTime.getHours() === hour;
    }
    if (event.date !== dateStr) return false;
    const eventHour = new Date(event.dateTime).getHours();
    return eventHour === hour;
  });
};
